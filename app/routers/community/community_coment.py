import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from typing import List
from uuid import uuid4
import os
import shutil

router = APIRouter(
    prefix="/coments",
    tags=["coments"]
)
UPLOAD_DIR = "static/coment_images"

@router.post("/add", response_model=schemas.CommunityComentOut)
async def create_coment_with_images(
    coment_content: str = Form(...),
    community_no: int = Form(...),
    user_no: int = Form(...),
    files: list[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    db_coment = models.CommunityComent(
        coment_content=coment_content,
        community_no=community_no,
        user_no=user_no,
    )
    db.add(db_coment)
    db.commit()
    db.refresh(db_coment)

    db_images = []
    if files:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        for file in files:
            ext = os.path.splitext(file.filename)[1]
            filename = f"{uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            image_path = f"/{UPLOAD_DIR}/{filename}"
            db_image = models.CommunityComentImage(
                coment_no=db_coment.coment_no,
                coment_image_path=image_path
            )
            db.add(db_image)
            db.commit()
            db.refresh(db_image)
            db_images.append(db_image)

    user_nickname = (
        db.query(models.User.user_nickname)
        .filter(models.User.user_no == db_coment.user_no)
        .scalar()
    )

    return {
        "coment_no": db_coment.coment_no,
        "coment_content": db_coment.coment_content,
        "coment_regist_at": db_coment.coment_regist_at,
        "community_no": db_coment.community_no,
        "user_no": db_coment.user_no,
        "user_nickname": user_nickname,
        "images": [
            {"coment_image_no": img.coment_image_no, "coment_image_path": img.coment_image_path}
            for img in db_images
        ] if db_images else []
    }

@router.delete("/{coment_no}")
def delete_coment(coment_no: int, db: Session = Depends(get_db)):
    db_coment = db.query(models.CommunityComent).filter(models.CommunityComent.coment_no == coment_no).first()
    if not db_coment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없음.")
    db.delete(db_coment)
    db.commit()
    return {"삭제 되었습니다."}

@router.get("/list", response_model=List[schemas.CommunityComentOut])
def get_coments(community_no: int, db: Session = Depends(get_db)):
    coments = (
        db.query(
            models.CommunityComent.coment_no,
            models.CommunityComent.coment_content,
            models.CommunityComent.coment_regist_at,
            models.CommunityComent.community_no,
            models.CommunityComent.user_no,
            models.User.user_nickname
        )
        .join(models.User, models.CommunityComent.user_no == models.User.user_no)
        .filter(models.CommunityComent.community_no == community_no)
        .all()
    )

    result = []
    for coment in coments:
        images = db.query(models.CommunityComentImage).filter(
            models.CommunityComentImage.coment_no == coment.coment_no
        ).all()
        result.append({
            "coment_no": coment.coment_no,
            "coment_content": coment.coment_content,
            "coment_regist_at": coment.coment_regist_at,
            "community_no": coment.community_no,
            "user_no": coment.user_no,
            "user_nickname": coment.user_nickname,
            "images": [
                {"coment_image_no": img.coment_image_no, "coment_image_path": img.coment_image_path}
                for img in images
            ]
        })
    return result

@router.get("/", response_model=List[schemas.CommunityComentOut])
def get_coments_root(community_no: int, db: Session = Depends(get_db)):
    return get_coments(community_no, db)

@router.put("/{coment_no}", response_model=schemas.ComentResponse)
async def update_coment(
    coment_no: int,
    coment_content: str = Form(...),
    keep_origin_images: str = Form(...),
    files: list[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    import json

    coment = db.query(models.CommunityComent).filter(models.CommunityComent.coment_no == coment_no).first()
    if not coment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

    # 댓글 내용 수정
    coment.coment_content = coment_content
    coment.coment_regist_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(coment)

    # 기존 이미지 유지/삭제 처리
    keep_ids = set(json.loads(keep_origin_images))
    all_images = db.query(models.CommunityComentImage).filter(
        models.CommunityComentImage.coment_no == coment_no
    ).all()
    for img in all_images:
        if img.coment_image_no not in keep_ids:
            # 파일도 삭제
            try:
                file_path = img.coment_image_path.lstrip("/")
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception:
                pass
            db.delete(img)
    db.commit()

    # 새 이미지 추가
    db_images = []
    if files:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        for file in files:
            ext = os.path.splitext(file.filename)[1]
            filename = f"{uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            image_path = f"/{UPLOAD_DIR}/{filename}"
            db_image = models.CommunityComentImage(
                coment_no=coment.coment_no,
                coment_image_path=image_path
            )
            db.add(db_image)
            db.commit()
            db.refresh(db_image)
            db_images.append(db_image)

    # 남은 이미지 목록
    remain_images = db.query(models.CommunityComentImage).filter(
        models.CommunityComentImage.coment_no == coment_no
    ).all()

    return {
        "coment_no": coment.coment_no,
        "coment_content": coment.coment_content,
        "coment_regist_at": coment.coment_regist_at.isoformat() if coment.coment_regist_at else None,
        "user_no": coment.user_no,
        "community_no": coment.community_no,
        "images": [
            {"coment_image_no": img.coment_image_no, "coment_image_path": img.coment_image_path}
            for img in remain_images
        ]
    }

@router.get("/counts", response_model=dict)
def get_all_coment_counts(db: Session = Depends(get_db)):
    counts = (
        db.query(models.CommunityComent.community_no, func.count(models.CommunityComent.coment_no).label("count"))
        .group_by(models.CommunityComent.community_no)
        .all()
    )
    return {"counts": {row.community_no: row.count for row in counts}}