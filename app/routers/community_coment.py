from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from typing import List

router = APIRouter(
    prefix="/comments",
    tags=["comments"]
)

@router.post("/add", response_model=schemas.CommunityCommentOut)
def create_comment(comment: schemas.CommunityCommentCreate, db: Session = Depends(get_db)):
    db_comment = models.CommunityComment(**comment.dict())
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)

    # user_nickname을 포함한 데이터를 반환하도록 수정
    user_nickname = (
        db.query(models.User.user_nickname)
        .filter(models.User.user_no == db_comment.user_no)
        .scalar()
    )

    if not user_nickname:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "coment_no": db_comment.coment_no,
        "coment_content": db_comment.coment_content,
        "coment_at": db_comment.coment_at,
        "community_no": db_comment.community_no,
        "user_no": db_comment.user_no,
        "user_nickname": user_nickname,
    }

@router.delete("/{comment_id}")
def delete_comment(comment_id: int, db: Session = Depends(get_db)):
    db_comment = db.query(models.CommunityComment).filter(models.CommunityComment.coment_no == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    db.delete(db_comment)
    db.commit()
    return {"message": "Comment deleted successfully"}

@router.get("/list", response_model=List[schemas.CommunityCommentOut])
def get_comments(community_no: int, db: Session = Depends(get_db)):
    comments = (
        db.query(
            models.CommunityComment.coment_no,
            models.CommunityComment.coment_content,
            models.CommunityComment.coment_at,
            models.CommunityComment.community_no,
            models.CommunityComment.user_no,
            models.User.user_nickname
        )
        .join(models.User, models.CommunityComment.user_no == models.User.user_no)
        .filter(models.CommunityComment.community_no == community_no)
        .all()
    )

    # 디버깅용 로그 추가
    print("Fetched comments:", comments)

    return comments

@router.get("/", response_model=List[schemas.CommunityCommentOut])
def get_comments_root(community_no: int, db: Session = Depends(get_db)):
    return get_comments(community_no, db)

@router.put("/{comment_id}", response_model=schemas.CommunityCommentOut)
def update_comment(comment_id: int, comment: schemas.CommunityCommentUpdate, db: Session = Depends(get_db)):
    print(f"Received comment_id: {comment_id}")
    db_comment = db.query(models.CommunityComment).filter(models.CommunityComment.coment_no == comment_id).first()
    if not db_comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    for key, value in comment.dict(exclude_unset=True).items():
        setattr(db_comment, key, value)
    db.commit()
    db.refresh(db_comment)

    # user_nickname을 추가로 조회
    user_nickname = (
        db.query(models.User.user_nickname)
        .filter(models.User.user_no == db_comment.user_no)
        .scalar()
    )

    if not user_nickname:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "coment_no": db_comment.coment_no,
        "coment_content": db_comment.coment_content,
        "coment_at": db_comment.coment_at,
        "community_no": db_comment.community_no,
        "user_no": db_comment.user_no,
        "user_nickname": user_nickname,
    }