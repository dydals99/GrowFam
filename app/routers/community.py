from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List
from app import schemas, models, database

router = APIRouter(
    prefix="/communities",
    tags=["communities"]
)
@router.get("/", response_model=List[schemas.CommunityOut])
def read_communities(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(database.get_db)
):
    posts = (
        db.query(
            models.Community.community_no,
            models.Community.community_title,
            models.Community.community_content,
            models.Community.user_no,
            models.Community.community_regist_at,
            models.Community.like_count,
            models.User.user_nickname.label("user_nickname")  # user_nickname 추가
        )
        .join(models.User, models.Community.user_no == models.User.user_no)
        .offset(skip)
        .limit(limit)
        .all()
    )

    print("Fetched posts:", posts)  # 디버깅용 출력

    return [
        {
            "community_no": post.community_no,
            "community_title": post.community_title,
            "community_content": post.community_content,
            "user_no": post.user_no,
            "user_nickname": post.user_nickname,  # user_nickname 포함
            "community_regist_at": post.community_regist_at,
            "like_count": post.like_count,
        }
        for post in posts
    ]
@router.post("/", response_model=schemas.CommunityOut, status_code=status.HTTP_201_CREATED)
def create_community(
    community: schemas.CommunityCreate,
    db: Session = Depends(database.get_db)
):
    db_comm = models.Community(**community.dict())
    db.add(db_comm)
    db.commit()
    db.refresh(db_comm)
    return db_comm

@router.get("/popular", response_model=List[schemas.CommunityOut])
def read_popular_communities(db: Session = Depends(database.get_db)):
    communities = db.query(models.Community).order_by(models.Community.like_count.desc()).all()
    return communities

@router.get("/{community_no}", response_model=schemas.CommunityOut)
def read_community(
    community_no: int,
    db: Session = Depends(database.get_db)
):
    # Community와 User를 조인하여 user_nickname 포함
    comm = (
        db.query(
            models.Community.community_no,
            models.Community.community_title,
            models.Community.community_content,
            models.Community.user_no,
            models.Community.community_regist_at,
            models.Community.like_count,
            models.User.user_nickname.label("user_nickname")  # user_nickname 추가
        )
        .join(models.User, models.Community.user_no == models.User.user_no)
        .filter(models.Community.community_no == community_no)
        .first()
    )

    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    # 반환 데이터 구성
    return {
        "community_no": comm.community_no,
        "community_title": comm.community_title,
        "community_content": comm.community_content,
        "user_no": comm.user_no,
        "user_nickname": comm.user_nickname,  # user_nickname 포함
        "community_regist_at": comm.community_regist_at,
        "like_count": comm.like_count,
    }

@router.put("/{community_no}", response_model=schemas.CommunityOut)
def update_community(
    community_no: int,
    community_in: schemas.CommunityUpdate,
    db: Session = Depends(database.get_db)
):
    comm = db.query(models.Community).get(community_no)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    for k, v in community_in.dict(exclude_unset=True).items():
        setattr(comm, k, v)
    comm.community_regist_at = func.now()  # 수정된 작성일 업데이트
    db.commit()
    db.refresh(comm)
    return comm

@router.delete("/{community_no}", status_code=status.HTTP_204_NO_CONTENT)
def delete_community(
    community_no: int,
    db: Session = Depends(database.get_db)
):
    comm = db.query(models.Community).get(community_no)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    db.delete(comm)
    db.commit()
