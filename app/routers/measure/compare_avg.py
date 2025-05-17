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
    height_data_df = pd.read_excel(excel_file_path, sheet_name="연령별 신장")
    height_data_df = height_data_df.dropna(subset=["만나이(개월)", "성별"])
    #print("height_data 열 이름:", height_data_df.columns)  # 열 이름 출력

    # 연령별 체중 데이터 처리
    weight_data_df = pd.read_excel(excel_file_path, sheet_name="연령별 체중")
    weight_data_df = weight_data_df.dropna(subset=["만나이(개월)", "성별"])
    #print("weight_data 열 이름:", weight_data_df.columns)  # 열 이름 출력

    # 연령별 체질량지수(BMI) 데이터 처리
    bmi_data_df = pd.read_excel(excel_file_path, sheet_name="연령별 체질량지수")
    bmi_data_df = bmi_data_df.dropna(subset=["만나이(개월)", "성별"])
    #print("BMI 데이터 열 이름:", bmi_data_df.columns)  # 열 이름 출력

    # 평균 및 백분위수 데이터(기존 로직 호환용)
    def make_dict(df, value_cols):
        temp = df[["만나이(개월)", "성별"] + value_cols]
        temp = temp.groupby(["만나이(개월)", "성별"]).mean().reset_index()
        return temp.set_index(["만나이(개월)", "성별"]).to_dict("index")

    height_data = make_dict(height_data_df, ["신장(cm) 백분위수", "신장(cm) 표준점수", "Unnamed: 12"])
    weight_data = make_dict(weight_data_df, ["체중(kg) 백분위수", "체중(kg) 표준점수", "Unnamed: 12"])
    bmi_data = make_dict(bmi_data_df, ["체질량지수(kg/m2) 백분위수", "체질량지수(kg/m2) 표준점수", "Unnamed: 12"])

except Exception as e:
    raise RuntimeError(f"엑셀 데이터를 읽는 중 오류가 발생했습니다: {e}")

def get_50th(row):
    if "Unnamed: 12" in row:
        return row["Unnamed: 12"]
    raise HTTPException(status_code=500, detail="중앙값(50th) 컬럼이 없습니다.")

def get_percentile_from_value(percentile_points, value_points, value):
    for i in range(len(value_points) - 1):
        if value_points[i] <= value <= value_points[i+1]:
            # 선형 보간
            x0, x1 = value_points[i], value_points[i+1]
            y0, y1 = percentile_points[i], percentile_points[i+1]
            if x1 == x0:
                return y0
            return y0 + (value - x0) * (y1 - y0) / (x1 - x0)
    if value < value_points[0]:
        return percentile_points[0]
    if value > value_points[-1]:
        return percentile_points[-1]
    return None
@router.post("/compare")
def compare_kid_data(request: CompareRequest):
    try:
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

        # 백분위수별 값 리스트 정의
        percentile_points = [3, 5, 10, 15, 25, 50, 75, 85, 90, 95, 97, 99]

        # 키 백분위수 계산
        row_h = height_data_df[(height_data_df["만나이(개월)"] == age) & (height_data_df["성별"] == gender)]
        if row_h.empty:
            raise HTTPException(status_code=404, detail="키 데이터 없음")
        height_value_points = [
            
            float(row_h["Unnamed: 7"].values[0]), # 3th
            float(row_h["Unnamed: 8"].values[0]), # 5th
            float(row_h["Unnamed: 9"].values[0]), # 10th
            float(row_h["Unnamed: 10"].values[0]), # 15th
            float(row_h["Unnamed: 11"].values[0]), # 25th
            float(row_h["Unnamed: 12"].values[0]), # 50th
            float(row_h["Unnamed: 13"].values[0]), # 75th
            float(row_h["Unnamed: 14"].values[0]), # 85th
            float(row_h["Unnamed: 15"].values[0]), # 90th
            float(row_h["Unnamed: 16"].values[0]), # 95th
            float(row_h["Unnamed: 17"].values[0]), # 97th
            float(row_h["Unnamed: 18"].values[0]), # 99th
        ]
        height_percentile = get_percentile_from_value(percentile_points, height_value_points, height)

        # 몸무게 백분위수 계산
        row_w = weight_data_df[(weight_data_df["만나이(개월)"] == age) & (weight_data_df["성별"] == gender)]
        if row_w.empty:
            raise HTTPException(status_code=404, detail="몸무게 데이터 없음")
        weight_value_points = [
            
            float(row_w["Unnamed: 7"].values[0]), # 3th
            float(row_w["Unnamed: 8"].values[0]), # 5th
            float(row_w["Unnamed: 9"].values[0]), # 10th
            float(row_w["Unnamed: 10"].values[0]), # 15th
            float(row_w["Unnamed: 11"].values[0]), # 25th
            float(row_w["Unnamed: 12"].values[0]), # 50th
            float(row_w["Unnamed: 13"].values[0]), # 75th
            float(row_w["Unnamed: 14"].values[0]), # 85th
            float(row_w["Unnamed: 15"].values[0]), # 90th
            float(row_w["Unnamed: 16"].values[0]), # 95th
            float(row_w["Unnamed: 17"].values[0]), # 97th
            float(row_w["Unnamed: 18"].values[0]), # 99th
        ]
        weight_percentile = get_percentile_from_value(percentile_points, weight_value_points, weight)

        # BMI 백분위수 계산
        row_b = bmi_data_df[(bmi_data_df["만나이(개월)"] == age) & (bmi_data_df["성별"] == gender)]
        if row_b.empty:
            raise HTTPException(status_code=404, detail="BMI 데이터 없음")
        bmi_value_points = [
            
            float(row_b["Unnamed: 7"].values[0]), # 3th
            float(row_b["Unnamed: 8"].values[0]), # 5th
            float(row_b["Unnamed: 9"].values[0]), # 10th
            float(row_b["Unnamed: 10"].values[0]), # 15th
            float(row_b["Unnamed: 11"].values[0]), # 25th
            float(row_b["Unnamed: 12"].values[0]), # 50th
            float(row_b["Unnamed: 13"].values[0]), # 75th
            float(row_b["Unnamed: 14"].values[0]), # 85th
            float(row_b["Unnamed: 15"].values[0]), # 90th
            float(row_b["Unnamed: 16"].values[0]), # 95th
            float(row_b["Unnamed: 17"].values[0]), # 97th
            float(row_b["Unnamed: 18"].values[0]), # 99th
        ]
        bmi_percentile = get_percentile_from_value(percentile_points, bmi_value_points, bmi)

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