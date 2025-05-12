from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models
from app.database import get_db

router = APIRouter(
    prefix="/community-likes",  # 전체 경로의 접두사를 통일
    tags=["community-like"]
)

@router.get("/status")
def get_like_status(
    community_no: int = Query(...),
    user_no: int = Query(...),
    db: Session = Depends(get_db)
):
    community = db.query(models.Community).filter_by(community_no=community_no).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community not found")
    
    existing_like = db.query(models.CommunityLike).filter_by(
        community_no=community_no,
        user_no=user_no
    ).first()

    return {
        "liked": existing_like is not None,
        "count": community.like_count
    }

@router.post("/toggle/{community_no}/like")
def toggle_like(
    community_no: int,
    user_no: int = Query(...),
    db: Session = Depends(get_db)
):
    community = db.query(models.Community).filter_by(community_no=community_no).first()
    if not community:
        raise HTTPException(status_code=404, detail="Community post not found")

    existing_like = db.query(models.CommunityLike).filter_by(
        community_no=community_no,
        user_no=user_no
    ).first()

    if existing_like:
        db.delete(existing_like)
        community.like_count = max(community.like_count - 1, 0)
        action = "unliked"
    else:
        new_like = models.CommunityLike(community_no=community_no, user_no=user_no)
        db.add(new_like)
        community.like_count += 1
        action = "liked"

    db.commit()

    return {
        "message": f"Post successfully {action}",
        "like_count": community.like_count
    }
