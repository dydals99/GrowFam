from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db
from app.models import Family, FamilyMonthGoals, KidInfo
from app.schemas import FamilyCreate, FamilyMonthGoalsCreate, KidInfoCreate

router = APIRouter()

@router.post("/family/complete")
def create_family_with_kid(
    family: FamilyCreate,
    goal: FamilyMonthGoalsCreate,
    kid: KidInfoCreate,
    db: Session = Depends(get_db)
):
    try:
        # 트랜잭션 시작
        # 1. 가족 정보 저장
        db_family = Family(user_no=family.user_no, family_nickname=family.family_nickname)
        db.add(db_family)
        db.commit()
        db.refresh(db_family)

        # 2. 이달의 목표 저장
        db_goal = FamilyMonthGoals(
            family_no=db_family.family_no,
            month_golas_contents=goal.month_golas_contents
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)

        # 3. 자녀 정보 저장
        db_kid = KidInfo(
            family_no=db_family.family_no,
            kid_height=kid.kid_height,
            kid_weight=kid.kid_weight,
            kid_gender=kid.kid_gender,
            kid_birthday=kid.kid_birthday,
        )
        db.add(db_kid)
        db.commit()
        db.refresh(db_kid)

        return {
            "family": db_family,
            "goal": db_goal,
            "kid": db_kid,
        }

    except SQLAlchemyError as e:
        # 에러 발생 시 롤백
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터 저장 중 오류가 발생했습니다: {str(e)}")