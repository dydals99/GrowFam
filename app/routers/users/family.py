import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db
from app.models import FamilyMonthGoals, KidInfo
from app.schemas import FamilyMonthGoalsCreate, KidInfoCreate

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/family/complete")
def create_family_data(
    goal: FamilyMonthGoalsCreate,
    kid: KidInfoCreate,
    db: Session = Depends(get_db)
):
    try:
        # 트랜잭션 시작
        logger.info(f"Received goal data: {goal}")
        logger.info(f"Received kid data: {kid}")

        # 1. 이달의 목표 저장
        db_goal = FamilyMonthGoals(
            family_no=goal.family_no,
            month_golas_contents=goal.month_golas_contents
        )
        db.add(db_goal)
        db.commit()
        db.refresh(db_goal)
        logger.info(f"Saved goal data: {db_goal}")

        # 2. 자녀 정보 저장
        db_kid = KidInfo(
            family_no=kid.family_no,
            kid_height=kid.kid_height,
            kid_weight=kid.kid_weight,
            kid_gender=kid.kid_gender,
            kid_birthday=kid.kid_birthday,
        )
        db.add(db_kid)
        db.commit()
        db.refresh(db_kid)
        logger.info(f"Saved kid data: {db_kid}")

        return {
            "success": True,
            "goal": db_goal,
            "kid": db_kid,
        }

    except SQLAlchemyError as e:
        # 에러 발생 시 롤백
        db.rollback()
        logger.error(f"Database error while saving family data: {str(e)}")
        raise HTTPException(status_code=500, detail=f"데이터 저장 중 오류가 발생했습니다: {str(e)}")