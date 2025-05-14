import datetime
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from typing import List

router = APIRouter(
    prefix="/coments",
    tags=["coments"]
)

@router.post("/add", response_model=schemas.CommunityComentOut)
def create_coment(coment: schemas.CommunityComentCreate, db: Session = Depends(get_db)):
    db_coment = models.CommunityComent(**coment.dict())
    db.add(db_coment)
    db.commit()
    db.refresh(db_coment)

    user_nickname = (
        db.query(models.User.user_nickname)
        .filter(models.User.user_no == db_coment.user_no)
        .scalar()
    )

    if not user_nickname:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "coment_no": db_coment.coment_no,
        "coment_content": db_coment.coment_content,
        "coment_regist_at": db_coment.coment_regist_at,
        "community_no": db_coment.community_no,
        "user_no": db_coment.user_no,
        "user_nickname": user_nickname,
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

    print("Fetched coments:", coments)

    return coments

@router.get("/", response_model=List[schemas.CommunityComentOut])
def get_coments_root(community_no: int, db: Session = Depends(get_db)):
    return get_coments(community_no, db)

@router.put("/{coment_no}", response_model=schemas.ComentResponse)
def update_coment(coment_no: int, request: schemas.ComentUpdateRequest, db: Session = Depends(get_db)):
    coment = db.query(models.CommunityComent).filter(models.CommunityComent.coment_no == coment_no).first()
    if not coment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없습니다.")

    coment.coment_content = request.coment_content
    coment.coment_regist_at = datetime.datetime.now(datetime.timezone.utc)  # 시간대 정보 포함
    db.commit()
    db.refresh(coment)

    return {
        "coment_no": coment.coment_no,
        "coment_content": coment.coment_content,
        "coment_regist_at": coment.coment_regist_at.isoformat(),
        "user_no": coment.user_no,
        "community_no": coment.community_no,
    }

@router.get("/counts", response_model=dict)
def get_all_coment_counts(db: Session = Depends(get_db)):
    counts = (
        db.query(models.CommunityComent.community_no, func.count(models.CommunityComent.coment_no).label("count"))
        .group_by(models.CommunityComent.community_no)
        .all()
    )
    return {"counts": {row.community_no: row.count for row in counts}}