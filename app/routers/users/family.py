import logging
from sqlalchemy.exc import SQLAlchemyError
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import  KidInfo, Measure
from app.schemas import  KidInfoCreate, KidInfoUpdate, KidDeleteRequest
from datetime import datetime

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/measure/kid-info", tags=["Measure"])
def get_kid_measurements(family_no: int, db: Session = Depends(get_db)):
    kids = db.query(
        KidInfo.kid_info_no,
        KidInfo.family_no, 
        KidInfo.kid_birthday,
        KidInfo.kid_gender,
        KidInfo.kid_weight,
        KidInfo.kid_height.label("default_height"),
        KidInfo.kid_info_regist_at.label("kid_info_regist_at"),
        KidInfo.kid_name
    ).filter(KidInfo.family_no == family_no).all()

    result = []
    for kid in kids:
        recent_measure = (
            db.query(Measure.measure_height, Measure.measure_regist_at)
            .filter(Measure.kid_info_no == kid.kid_info_no)
            .order_by(Measure.measure_regist_at.desc())
            .first()
        )

        # 비교: 최근 측정값 vs 최근 직접 입력값
        if recent_measure:
            measure_height, measure_regist_at = recent_measure
            kid_info_regist_at = kid.kid_info_regist_at
            if kid_info_regist_at and measure_regist_at < kid_info_regist_at:
                height = kid.default_height
            else:
                height = measure_height
        else:
            height = kid.default_height

        result.append({
            "kid_info_no": kid.kid_info_no,
            "family_no": kid.family_no,
            "kid_birthday": kid.kid_birthday,
            "kid_gender": kid.kid_gender,
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
        db_kid.kid_info_regist_at = datetime.now()  # 수정일 갱신

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