import os
import aiofiles
import cv2
import numpy as np
import mediapipe as mp
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserPhoto

router = APIRouter(
    prefix="/act_camera",
    tags=["act_camera"]
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(os.getcwd(), "uploaded_photos")

def extract_person_contour(image_path: str, output_path: str):
    # 이미지 로드
    image = cv2.imread(image_path)
    if image is None:
        print("이미지 로드 실패:", image_path)
        return None

    # RGB로 변환
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    # Mediapipe Selfie Segmentation 사용
    mp_selfie_segmentation = mp.solutions.selfie_segmentation
    with mp_selfie_segmentation.SelfieSegmentation(model_selection=1) as segmenter:
        results = segmenter.process(image_rgb)
        if results.segmentation_mask is None:
            print("세그멘테이션 실패")
            return None
        mask = results.segmentation_mask

    # 마스크 이진화 (임계값 0.5)
    binary_mask = (mask > 0.5).astype(np.uint8) * 255

    # 모폴로지 연산을 통해 노이즈 제거 및 마스크 정제 (클로징)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    cleaned_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_CLOSE, kernel, iterations=2)

    # 외곽 윤곽선 추출
    contours, _ = cv2.findContours(cleaned_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        print("윤곽선 검출 실패")
        return None

    # 가장 큰 윤곽선을 사람 외곽으로 가정
    largest_contour = max(contours, key=cv2.contourArea)

    # 원본 이미지에 윤곽선 그리기 (녹색, 두께 5)
    contour_image = image.copy()
    cv2.drawContours(contour_image, [largest_contour], -1, (0, 255, 0), 5)

    # 결과 이미지 저장
    success = cv2.imwrite(output_path, contour_image)
    if not success:
        print("결과 이미지 저장 실패")
        return None
    return output_path

@router.post("/upload")
async def upload_file(file: UploadFile, request: Request, db: Session = Depends(get_db)) -> JSONResponse:
    # 저장할 디렉토리가 없으면 생성 (이미 생성한 경우는 무시됨)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # 파일 저장 경로 (서버 내부 경로)
    upload_path = os.path.join(UPLOAD_DIR, file.filename)
    upload_path = upload_path.replace("\\", "/")  # OS별 경로 구분자 정리

    try:
        # aiofiles를 사용해 파일을 비동기로 저장
        async with aiofiles.open(upload_path, "wb") as out_file:
            content = await file.read()
            await out_file.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"파일 저장 실패: {e}")

    # 절대 URL 생성: 예) "http://172.30.1.26:8080/static/photo_xxx.jpg"
    base_url = str(request.base_url).rstrip("/")  # 예: "http://172.30.1.26:8080"
    absolute_url = f"{base_url}/static/{file.filename}"

    # DB에 저장할 때, contour_path에 절대 URL 저장 (모델에 따라 contour_path 컬럼 사용)
    try:
        new_photo = UserPhoto(
            file_name = file.filename,
            contour_path = absolute_url
        )
        db.add(new_photo)
        db.commit()
        db.refresh(new_photo)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {e}")

    return JSONResponse(content={
        "filename": file.filename,
        "contour_path": absolute_url,  # 클라이언트에 절대 URL 반환
        "db_id": new_photo.file_no
    })
