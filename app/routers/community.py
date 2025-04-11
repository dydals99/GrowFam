from fastapi import APIRouter, Depends, HTTPException, status
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
    posts = db.query(models.Community).offset(skip).limit(limit).all()
    return posts

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
    comm = db.query(models.Community).get(community_no)
    if not comm:
        raise HTTPException(status_code=404, detail="Community not found")
    return comm

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
