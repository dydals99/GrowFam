import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from app.schemas import CompareRequest


router = APIRouter()

# 현재 파일의 디렉토리 경로
current_dir = os.path.dirname(os.path.abspath(__file__))

# 엑셀 파일의 절대 경로
excel_file_path = os.path.join(current_dir, "height_weight_data.xlsx")

# 엑셀 데이터 읽기
try:
    # 특정 시트 선택 (예: "연령별 신장")
    excel_data = pd.read_excel(excel_file_path, sheet_name="연령별 신장")

    # 열 이름 출력 (디버깅용)
    print("열 이름:", excel_data.columns)

    # 불필요한 행 제거 (예: 설명 행 제거)
    excel_data = excel_data.dropna(subset=["만나이(세)"])  # 만나이(세)가 없는 행 제거

    # 필요한 열만 선택
    excel_data = excel_data[["만나이(세)", "신장(cm) 백분위수", "신장(cm) 표준점수"]]

    # 중복된 만나이(세) 값 처리: 평균값으로 그룹화
    excel_data = excel_data.groupby("만나이(세)").mean().reset_index()

    # 데이터 처리: 만나이(세)를 인덱스로 설정
    age_data = excel_data.set_index("만나이(세)").to_dict("index")

except Exception as e:
    raise RuntimeError(f"엑셀 데이터를 읽는 중 오류가 발생했습니다: {e}")

@router.post("/compare")
def compare_kid_data(request: CompareRequest):
    # 요청 데이터 로깅
    print("요청 데이터:", request.dict())

    age = request.age
    height = request.height
    weight = request.weight

    if age not in age_data:
        raise HTTPException(status_code=404, detail="해당 나이에 대한 데이터가 없습니다.")

    # 평균 신장 가져오기
    average_height = age_data[age]["신장(cm) 백분위수"]

    # 아이의 키와 평균 키 비교
    height_difference = height - average_height

    # 결과 반환
    return {
        "age": age,
        "height": round(height, 1),
        "weight": round(weight, 1),
        "averageHeight": round(average_height, 1),
        "heightDifference": round(height_difference, 1),
    }