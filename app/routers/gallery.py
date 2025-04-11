import os
import random
import time
import cv2
import numpy as np
import mediapipe as mp
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserPhoto, CombineImage

router = APIRouter( 
    prefix="/gallery",
    tags=["gallery"]
)
 
@router.get("/photos") 
def get_all_photos(db: Session = Depends(get_db)):
    user_photos = db.query(UserPhoto).all()
    combined_photos = db.query(CombineImage).all()

    def format_user_photo(photo):
            return {
            "id": photo.file_no,
            "file_name": photo.file_name,
            "contour_path": photo.contour_path,  # 절대 URL 저장됨
            "uploaded_at": photo.uploaded_at,
            "type": "user"
        }

    def format_combined_photo(photo):
        return {
            "id": photo.combine_image_no,
            "file_name": photo.combine_image_name,
            "file_path": photo.combine_image_path,
            "combine_image_at": photo.combine_image_at,
            "type": "combined"
        }

    all_photos = [*map(format_user_photo, user_photos), *map(format_combined_photo, combined_photos)]

    # 최신순 정렬 (선택사항)
    all_photos.sort(key=lambda x: x.get("id", 0), reverse=True)

    return {"photos": all_photos}

@router.get("/latest-photo")
async def get_latest_photo(db: Session = Depends(get_db)):
    latest_photo = db.query(UserPhoto).order_by(UserPhoto.uploaded_at.desc()).first()
    if latest_photo:
        return {"contour_path": latest_photo.contour_path}
    return {"contour_path": None}

UPLOAD_DIR = os.path.join(os.getcwd(), "uploaded_photos")

@router.post("/combine")
async def combine_contours(request: Request, db: Session = Depends(get_db)):
    # 클라이언트로부터 선택된 사진들의 ID 배열 받기
    body = await request.json()
    photo_ids = body.get("photo_ids")
    if not photo_ids:
        raise HTTPException(status_code=400, detail="photo_ids가 필요합니다.")
    
    photos = db.query(UserPhoto).filter(UserPhoto.file_no.in_(photo_ids))\
             .order_by(UserPhoto.uploaded_at.asc()).all()
    if not photos:
        raise HTTPException(status_code=404, detail="선택된 사진이 없습니다.")

    def get_local_path(url: str) -> str:
        filename = url.split("/")[-1]
        return os.path.join(UPLOAD_DIR, filename)

    first_photo = photos[0]
    first_path = get_local_path(first_photo.contour_path)
    first_img = cv2.imread(first_path)
    if first_img is None:
        raise HTTPException(status_code=500, detail="첫 번째 이미지 로드 실패")
    height, width, _ = first_img.shape
    combined_canvas = np.full((height, width, 3), 255, dtype=np.uint8)  # 흰색 배경

    used_colors = []
    def get_unique_random_color():
        # 이전에 사용한 색은 제외하고 랜덤 색상 생성 (RGB 튜플)
        while True:
            color = (random.randint(0,255), random.randint(0,255), random.randint(0,255))
            if color not in used_colors:
                used_colors.append(color)
                return color

    # 초록색 윤곽선만 추출하기 위한 범위 (BGR 형식)
    lower_green = np.array([0, 230, 0])
    upper_green = np.array([30, 255, 30])
    
    # 각 사진에 대해 처리 (시간 순서대로)
    for photo in photos:
        local_path = get_local_path(photo.contour_path)
        img = cv2.imread(local_path)
        if img is None:
            continue
        # 기존에 그려진 윤곽선(초록색)만 추출: inRange를 사용
        mask = cv2.inRange(img, lower_green, upper_green)
        # 만약 윤곽선이 없다면 건너뜁니다.
        if cv2.countNonZero(mask) == 0:
            continue
        # 각 사진마다 고유한 랜덤 색상 생성 (이전에 사용한 색은 제외)
        new_color = get_unique_random_color()
        # combined_canvas의 해당 영역에 새로운 색상을 덮어쓰기 (순서대로 오버레이)
        combined_canvas[mask == 255] = new_color

    # 합성된 이미지를 파일로 저장
    combined_filename = f"combined_{int(time.time())}.jpg"
    combined_path = os.path.join(UPLOAD_DIR, combined_filename)
    if not cv2.imwrite(combined_path, combined_canvas):
        raise HTTPException(status_code=500, detail="합성 이미지 저장 실패")

    base_url = str(request.base_url).rstrip("/")
    combined_image_url = f"{base_url}/static/{combined_filename}"

    # 새롭게 생성된 합성 이미지를 DB의 CombineImage 테이블에 저장
    new_combine = CombineImage(
        combine_image_name=combined_filename,
        combine_image_path=combined_image_url
    )
    try:
        db.add(new_combine)
        db.commit()
        db.refresh(new_combine)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {e}")

    return JSONResponse(content={
        "combined_image_url": combined_image_url,
        "combine_image_no": new_combine.combine_image_no
    })
