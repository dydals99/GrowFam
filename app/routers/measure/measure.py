from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import KidInfo, Measure

router = APIRouter()

@router.get("/measure/height", tags=["Measure"])
def get_height_measurements(family_no: int, db: Session = Depends(get_db)):
    """
    가족 번호(family_no)를 기준으로 키 측정 데이터를 가져옵니다.
    """
    measurements = db.query(Measure).filter(Measure.family_no == family_no).order_by(Measure.measure_regist_at).all()

    # 데이터 직렬화
    result = [
        {
            "measure_no": m.measure_no,
            "family_no": m.family_no,
            "measure_height": m.measure_height, 
            "measure_regist_at": m.measure_regist_at
        }
        for m in measurements
    ]

    return result
@router.get("/measure/kid-info", tags=["Measure"])
def get_kid_measurements(family_no: int, db: Session = Depends(get_db)):
    """
    가족 번호(family_no)를 기준으로 아이의 키, 나이, 몸무게를 가져옵니다.
    - 키는 tb_measure에서 가장 최근 측정값을 가져옵니다.
    - 만약 측정된 키가 없다면 tb_kid_info에서 기본 키 값을 가져옵니다.
    """
    # tb_kid_info에서 아이의 나이와 몸무게 가져오기
    kids = db.query(
        KidInfo.kid_info_no,
        KidInfo.family_no,  # family_no를 명시적으로 쿼리
        KidInfo.kid_birthday,
        KidInfo.kid_gender,
        KidInfo.kid_weight,
        KidInfo.kid_height.label("default_height")
    ).filter(KidInfo.family_no == family_no).all()

    result = []
    for kid in kids:
        # tb_measure에서 가장 최근 측정된 키 가져오기
        recent_measure = (
            db.query(Measure.measure_height)
            .filter(Measure.family_no == family_no)
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
        })

    return result