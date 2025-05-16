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
    # 연령별 신장 데이터 처리
    height_data = pd.read_excel(excel_file_path, sheet_name="연령별 신장")
    height_data = height_data.dropna(subset=["만나이(개월)", "성별"])
    print("height_data 열 이름:", height_data.columns)  # 열 이름 출력

    # 필요한 열만 선택 (중앙값은 Unnamed: 12 컬럼)
    height_data = height_data[["만나이(개월)", "성별", "신장(cm) 백분위수", "신장(cm) 표준점수", "Unnamed: 12"]]
    height_data = height_data.groupby(["만나이(개월)", "성별"]).mean().reset_index()
    height_data = height_data.set_index(["만나이(개월)", "성별"]).to_dict("index")

    # 연령별 체중 데이터 처리
    weight_data = pd.read_excel(excel_file_path, sheet_name="연령별 체중")
    weight_data = weight_data.dropna(subset=["만나이(개월)", "성별"])
    print("weight_data 열 이름:", weight_data.columns)  # 열 이름 출력

    weight_data = weight_data[["만나이(개월)", "성별", "체중(kg) 백분위수", "체중(kg) 표준점수", "Unnamed: 12"]]
    weight_data = weight_data.groupby(["만나이(개월)", "성별"]).mean().reset_index()
    weight_data = weight_data.set_index(["만나이(개월)", "성별"]).to_dict("index")

    # 연령별 체질량지수(BMI) 데이터 처리
    bmi_data = pd.read_excel(excel_file_path, sheet_name="연령별 체질량지수")
    print("BMI 데이터 열 이름:", bmi_data.columns)  # 열 이름 출력

    # 필요한 열만 선택 (중앙값은 Unnamed: 12 컬럼)
    bmi_data = bmi_data.dropna(subset=["만나이(개월)", "성별"])
    bmi_data = bmi_data[["만나이(개월)", "성별", "체질량지수(kg/m2) 백분위수", "체질량지수(kg/m2) 표준점수", "Unnamed: 12"]]
    bmi_data = bmi_data.groupby(["만나이(개월)", "성별"]).mean().reset_index()
    bmi_data = bmi_data.set_index(["만나이(개월)", "성별"]).to_dict("index")

except Exception as e:
    raise RuntimeError(f"엑셀 데이터를 읽는 중 오류가 발생했습니다: {e}")

def get_50th(row):
    if "Unnamed: 12" in row:
        return row["Unnamed: 12"]
    raise HTTPException(status_code=500, detail="중앙값(50th) 컬럼이 없습니다.")

@router.post("/compare")
def compare_kid_data(request: CompareRequest):
    try:
        # 요청 데이터 로깅
        print("요청 데이터:", request.dict())

        age = request.ageInMonths
        height = request.height
        weight = request.weight
        gender = request.gender

        # 입력 데이터 검증
        if age <= 0 or height <= 0 or weight <= 0:
            raise HTTPException(status_code=400, detail="유효하지 않은 입력 값입니다.")

        # 개월 수에 맞는 데이터 검증
        if (age, gender) not in height_data or (age, gender) not in weight_data or (age, gender) not in bmi_data:
            raise HTTPException(status_code=404, detail="해당 나이와 성별에 대한 데이터가 없습니다.")

        # 평균 신장, 체중, BMI 가져오기 (중앙값)
        average_height = get_50th(height_data[(age, gender)])
        average_weight = get_50th(weight_data[(age, gender)])
        average_bmi = get_50th(bmi_data[(age, gender)])

        # 아이의 키, 몸무게, BMI와 평균 비교
        height_difference = height - average_height
        weight_difference = weight - average_weight
        bmi = weight / ((height / 100) ** 2)  # BMI 계산
        bmi_difference = bmi - average_bmi

        # 백분위수 데이터 가져오기
        height_percentile = height_data[(age, gender)]["신장(cm) 백분위수"]
        weight_percentile = weight_data[(age, gender)]["체중(kg) 백분위수"]
        bmi_percentile = bmi_data[(age, gender)]["체질량지수(kg/m2) 백분위수"]

        # 결과 반환
        return {
            "age": age,
            "gender": "남자" if gender == 1 else "여자",
            "height": round(height, 1),
            "weight": round(weight, 1),
            "bmi": round(bmi, 1),
            "averageHeight": round(average_height, 1),
            "averageWeight": round(average_weight, 1),
            "averageBMI": round(average_bmi, 1),
            "heightDifference": round(height_difference, 1),
            "weightDifference": round(weight_difference, 1),
            "bmiDifference": round(bmi_difference, 1),
            "heightPercentile": round(height_percentile, 1),  
            "weightPercentile": round(weight_percentile, 1),  
            "bmiPercentile": round(bmi_percentile, 1),       
        }
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="키 값이 0이거나 잘못된 값입니다.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 오류: {str(e)}")