from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy import func
from sqlalchemy.orm import Session
from app import schemas, models, database
from typing import List
from uuid import uuid4
import json
import os


router = APIRouter(
    prefix="/communities",
    tags=["communities"]
)

UPLOAD_DIR = "static/community_images"

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
            models.User.user_nickname.label("user_nickname") 
        )
        .join(models.User, models.Community.user_no == models.User.user_no)
        .order_by(models.Community.community_regist_at.desc())  
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
@router.post("/write", response_model=schemas.CommunityOut, status_code=status.HTTP_201_CREATED)
async def create_community_with_images(
    community_title: str = Form(...),
    community_content: str = Form(...),
    user_no: int = Form(...),
    files: List[UploadFile] = File(None),
    db: Session = Depends(database.get_db)
):
    db_comm = models.Community(
        community_title=community_title,
        community_content=community_content,
        user_no=user_no,
    )
    db.add(db_comm)
    db.commit()
    db.refresh(db_comm)

    db_images = []
    try:
        # 여러 장 이미지 저장
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
                db_image = models.CommunityImage(
                    community_no=db_comm.community_no,
                    image_path=image_path
                )
                db.add(db_image)
                db.commit()
                db.refresh(db_image)
                db_images.append(db_image)

        # User와 조인하여 user_nickname 포함해서 반환
        result = (
            db.query(
                models.Community.community_no,
                models.Community.community_title,
                models.Community.community_content,
                models.Community.user_no,
                models.Community.community_regist_at,
                models.Community.like_count,
                models.User.user_nickname.label("user_nickname")
            )
            .join(models.User, models.Community.user_no == models.User.user_no)
            .filter(models.Community.community_no == db_comm.community_no)
            .first()
        )

        response = {
            "community_no": result.community_no,
            "community_title": result.community_title,
            "community_content": result.community_content,
            "user_no": result.user_no,
            "user_nickname": result.user_nickname,
            "community_regist_at": result.community_regist_at,
            "like_count": result.like_count,
            "images": [
                {"image_no": img.image_no, "image_path": img.image_path}
                for img in db_images
            ] if db_images else []
        }
        return response

    except Exception as e:
        db.rollback()
        # 파일 삭제
        for img in db_images:
            if img.image_path and os.path.exists(img.image_path[1:]):
                os.remove(img.image_path[1:])
        db.delete(db_comm)
        db.commit()
        raise HTTPException(status_code=500, detail=f"글/이미지 저장 중 오류: {str(e)}")

@router.get("/search", response_model=List[schemas.CommunityOut])
def search_communities(
    q: str = Query(..., min_length=1, description="검색어"),
    db: Session = Depends(database.get_db)
):
    q_no_space = q.replace(" ", "")
    posts = (
        db.query(
            models.Community.community_no,
            models.Community.community_title,
            models.Community.community_content,
            models.Community.user_no,
            models.Community.community_regist_at,
            models.Community.like_count,
            models.User.user_nickname.label("user_nickname")
        )
        .join(models.User, models.Community.user_no == models.User.user_no)
        .filter(
            func.replace(models.Community.community_title, " ", "").ilike(f"%{q_no_space}%") |
            func.replace(models.Community.community_content, " ", "").ilike(f"%{q_no_space}%") |
            func.replace(models.User.user_nickname, " ", "").ilike(f"%{q_no_space}%")
        )
        .order_by(models.Community.community_regist_at.desc())
        .all()
    )
    return [
        {
            "community_no": post.community_no,
            "community_title": post.community_title,
            "community_content": post.community_content,
            "user_no": post.user_no,
            "user_nickname": post.user_nickname,
            "community_regist_at": post.community_regist_at,
            "like_count": post.like_count,
        }
        for post in posts
    ]

@router.get("/popular", response_model=List[schemas.CommunityOut])
def read_popular_communities(db: Session = Depends(database.get_db)):
    posts = (
        db.query(
            models.Community.community_no,
            models.Community.community_title,
            models.Community.community_content,
            models.Community.user_no,
            models.Community.community_regist_at,
            models.Community.like_count,
            models.User.user_nickname.label("user_nickname")
        )
        .join(models.User, models.Community.user_no == models.User.user_no)
        .order_by(models.Community.like_count.desc())
        .all()
    )
    return [
        {
            "community_no": post.community_no,
            "community_title": post.community_title,
            "community_content": post.community_content,
            "user_no": post.user_no,
            "user_nickname": post.user_nickname,
            "community_regist_at": post.community_regist_at,
            "like_count": post.like_count,
        }
        for post in posts
    ]

@router.get("/{community_no}", response_model=schemas.CommunityOut)
def read_community(
    community_no: int,
    db: Session = Depends(database.get_db)
):
    comm = (
        db.query(
            models.Community.community_no,
            models.Community.community_title,
            models.Community.community_content,
            models.Community.user_no,
            models.Community.community_regist_at,
            models.Community.like_count,
            models.User.user_nickname.label("user_nickname")
        )
        .join(models.User, models.Community.user_no == models.User.user_no)
        .filter(models.Community.community_no == community_no)
        .first()
    )

    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    images = db.query(
        models.CommunityImage.image_no,
        models.CommunityImage.image_path
    ).filter(models.CommunityImage.community_no == community_no).all()

    response = {
        "community_no": comm.community_no,
        "community_title": comm.community_title,
        "community_content": comm.community_content,
        "user_no": comm.user_no,
        "user_nickname": comm.user_nickname,
        "community_regist_at": comm.community_regist_at,
        "like_count": comm.like_count,
        "images": [
            {"image_no": img.image_no, "image_path": img.image_path}
            for img in images
        ]
    }
    return response

@router.put("/{community_no}", response_model=schemas.CommunityOut)
async def update_community(
    community_no: int,
    community_title: str = Form(...),
    community_content: str = Form(...),
    keep_origin_images: str = Form(...), 
    files: List[UploadFile] = File(None),
    db: Session = Depends(database.get_db)
):
    comm = db.query(models.Community).get(community_no)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    comm.community_title = community_title
    comm.community_content = community_content
    comm.community_regist_at = func.now()

    # 기존 이미지 중 남길 것만 남기고 삭제
    keep_ids = json.loads(keep_origin_images)
    all_images = db.query(models.CommunityImage).filter(models.CommunityImage.community_no == community_no).all()
    for img in all_images:
        if img.image_no not in keep_ids:
            if img.image_path and os.path.exists(img.image_path[1:]):
                os.remove(img.image_path[1:])
            db.delete(img)
    db.commit()

    # 새 이미지가 있으면 여러 장 추가
    if files:
        for file in files:
            ext = os.path.splitext(file.filename)[1]
            filename = f"{uuid4().hex}{ext}"
            file_path = os.path.join(UPLOAD_DIR, filename)
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            image_path = f"/{UPLOAD_DIR}/{filename}"
            db_image = models.CommunityImage(
                community_no=community_no,
                image_path=image_path
            )
            db.add(db_image)
            db.commit()
            db.refresh(db_image)

    db.commit()
    db.refresh(comm)

    # 결과 반환 (상세조회와 동일하게)
    images = db.query(
        models.CommunityImage.image_no,
        models.CommunityImage.image_path
    ).filter(models.CommunityImage.community_no == community_no).all()

    response = {
        "community_no": comm.community_no,
        "community_title": comm.community_title,
        "community_content": comm.community_content,
        "user_no": comm.user_no,
        "user_nickname": db.query(models.User.user_nickname).filter(models.User.user_no == comm.user_no).scalar(),
        "community_regist_at": comm.community_regist_at,
        "like_count": comm.like_count,
        "images": [
            {"image_no": img.image_no, "image_path": img.image_path}
            for img in images
        ]
    }
    return response

@router.delete("/{community_no}", status_code=204)
async def delete_community(
    community_no: int,
    db: Session = Depends(database.get_db)
):
    comm = db.query(models.Community).get(community_no)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")

    # 이미지 파일 및 DB 삭제
    images = db.query(models.CommunityImage).filter(models.CommunityImage.community_no == community_no).all()
    for img in images:
        if img.image_path and os.path.exists(img.image_path[1:]):
            os.remove(img.image_path[1:])
        db.delete(img)
    db.delete(comm)
    db.commit()
    return
