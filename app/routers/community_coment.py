from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from typing import List

router = APIRouter(
    prefix="/coments",
    tags=["coments"]
)

@router.post("/add", response_model=schemas.CommunityComentOut)
def create_comment(comment: schemas.CommunityComentCreate, db: Session = Depends(get_db)):
    db_coment = models.CommunityComent(**comment.dict())
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
        "coment_at": db_coment.coment_at,
        "community_no": db_coment.community_no,
        "user_no": db_coment.user_no,
        "user_nickname": user_nickname,
    }

@router.delete("/{coment_no}")
def delete_comment(coment_no: int, db: Session = Depends(get_db)):
    db_coment = db.query(models.CommunityComent).filter(models.CommunityComent.coment_no == coment_no).first()
    if not db_coment:
        raise HTTPException(status_code=404, detail="댓글을 찾을 수 없음.")
    db.delete(db_coment)
    db.commit()
    return {"삭제 되었습니다."}

@router.get("/list", response_model=List[schemas.CommunityComentOut])
def get_comments(community_no: int, db: Session = Depends(get_db)):
    comments = (
        db.query(
            models.CommunityComent.coment_no,
            models.CommunityComent.coment_content,
            models.CommunityComent.coment_at,
            models.CommunityComent.community_no,
            models.CommunityComent.user_no,
            models.User.user_nickname
        )
        .join(models.User, models.CommunityComent.user_no == models.User.user_no)
        .filter(models.CommunityComent.community_no == community_no)
        .all()
    )

    print("Fetched coments:", comments)

    return comments

@router.get("/", response_model=List[schemas.CommunityComentOut])
def get_comments_root(community_no: int, db: Session = Depends(get_db)):
    return get_comments(community_no, db)

@router.put("/{coment_no}", response_model=schemas.CommunityComentOut)
def update_coment(coment_no: int, coment: schemas.CommunityComentUpdate, db: Session = Depends(get_db)):
    print(f"Received comment_no: {coment_no}")
    db_coment = db.query(models.CommunityComent).filter(models.CommunityComent.coment_no == coment_no).first()
    if not db_coment:
        raise HTTPException(status_code=404, detail="Comment not found")
    for key, value in coment.dict(exclude_unset=True).items():
        setattr(db_coment, key, value)
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
        "coment_at": db_coment.coment_at,
        "community_no": db_coment.community_no,
        "user_no": db_coment.user_no,
        "user_nickname": user_nickname,
    }