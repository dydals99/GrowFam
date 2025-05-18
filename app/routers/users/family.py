import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.database import get_db
from app.models import FamilyMonthGoals, KidInfo, Measure
from app.schemas import FamilyMonthGoalsCreate, KidInfoCreate, KidInfoUpdate, KidDeleteRequest

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
    
@router.get("/measure/kid-info", tags=["Measure"])
def get_kid_measurements(family_no: int, db: Session = Depends(get_db)):
   
    kids = db.query(
        KidInfo.kid_info_no,
        KidInfo.family_no, 
        KidInfo.kid_birthday,
        KidInfo.kid_gender,
        KidInfo.kid_weight,
        KidInfo.kid_height.label("default_height"),
        KidInfo.kid_name
    ).filter(KidInfo.family_no == family_no).all()

    result = []
    for kid in kids:
      
        recent_measure = (
            db.query(Measure.measure_height)
            .filter(Measure.kid_info_no == kid.kid_info_no)
            .order_by(Measure.measure_regist_at.desc())
            .first()
        )

        # 측정된 키가 있으면 사용, 없으면 tb_kid_info의 기본 키 값 사용
        height = recent_measure.measure_height if recent_measure else kid.default_height

        result.append({
            "kid_info_no": kid.kid_info_no,
            "family_no": kid.family_no,
            "kid_birthday": kid.kid_birthday,
            "kid_gender" : kid.kid_gender,
            "kid_weight": kid.kid_weight,
            "kid_height": height,
            "kid_name": kid.kid_name
        })

    return result

@router.post("/family/kid/update", tags=["Family"])
def update_kid_info(
    kid: KidInfoUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_kid = db.query(KidInfo).filter(KidInfo.kid_info_no == kid.kid_info_no).first()
        if not db_kid:
            raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")

        db_kid.kid_name = kid.kid_name
        db_kid.kid_birthday = kid.kid_birthday
        db_kid.kid_gender = kid.kid_gender
        db_kid.kid_height = kid.kid_height
        db_kid.kid_weight = kid.kid_weight

        db.commit()
        db.refresh(db_kid)
        return {"success": True, "kid": db_kid}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"수정 중 오류 발생: {str(e)}")

@router.post("/family/kid/delete", tags=["Family"])
def delete_kid_info(
    req: KidDeleteRequest,
    db: Session = Depends(get_db)
):
    try:
        db_kid = db.query(KidInfo).filter(KidInfo.kid_info_no == req.kid_info_no).first()
        if not db_kid:
            raise HTTPException(status_code=404, detail="아이 정보를 찾을 수 없습니다.")
        db.delete(db_kid)
        db.commit()
        return {"success": True}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"삭제 중 오류 발생: {str(e)}")
    

@router.post("/family/kid/add", tags=["Family"])
def add_kid_info(
    kid: KidInfoCreate,
    db: Session = Depends(get_db)
):
    try:
        db_kid = KidInfo(
            family_no=kid.family_no,
            kid_name=kid.kid_name,
            kid_birthday=kid.kid_birthday,
            kid_gender=kid.kid_gender,
            kid_height=kid.kid_height,
            kid_weight=kid.kid_weight,
        )
        db.add(db_kid)
        db.commit()
        db.refresh(db_kid)
        return {"success": True, "kid": db_kid}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"추가 중 오류 발생: {str(e)}")