from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import KidInfo, Measure

router = APIRouter()

@router.get("/measure/height", tags=["Measure"])
def get_height_measurements(kid_info_no: int, db: Session = Depends(get_db)):
    
    measurements = db.query(Measure).filter(Measure.kid_info_no == kid_info_no).order_by(Measure.measure_regist_at).all()

    # 데이터 직렬화
    result = [
        {
            "measure_no": m.measure_no,
            "family_no": m.kid_info_no,
            "measure_height": m.measure_height, 
            "measure_regist_at": m.measure_regist_at
        }
        for m in measurements
    ]

    return result
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

@router.post("/measure/save", tags=["Measure"])
def save_measure(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    """
    키 측정값 저장 API
    - kid_info_no: int
    - measure_height: str (cm 단위, 소수점 가능)
    """
    kid_info_no = data.get("kid_info_no")
    measure_height = data.get("measure_height")

    if not kid_info_no or not measure_height:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="kid_info_no와 measure_height는 필수입니다."
        )

    try:
        measure = Measure(
            kid_info_no=kid_info_no,
            measure_height=measure_height
        )
        db.add(measure)
        db.commit()
        db.refresh(measure)
        return {"success": True, "measure_no": measure.measure_no}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}