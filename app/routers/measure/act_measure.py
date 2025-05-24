from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2, base64
from ultralytics import YOLO
import math
import os

router = APIRouter()

# YOLO 모델 설정 (사람 감지)
person_model = YOLO("yolov8s.pt", task="detect")

# 허용 기울기 범위 (±5도)
MAX_PITCH_DEG = 5.0  

# 카메라 파라미터 로드 (캘리브레이션 결과 파일 필요)
camera_params_path = "camera_params.npz"
if os.path.exists(camera_params_path):
    cam_data = np.load(camera_params_path)
    cam_mtx = cam_data["mtx"]
    cam_dist = cam_data["dist"]
else:
    cam_mtx = None
    cam_dist = None

# Base64 인코딩 함수
def encode_b64(img: np.ndarray) -> str:
    _, buf = cv2.imencode('.jpg', img)
    return base64.b64encode(buf).decode('utf-8')

@router.post("/estimate-child-height")
async def estimate_child_height(
    ref_height: float = Form(...),         # 기준 사람람 실제 키 (cm)
    camera_pitch: float = Form(...),       # pitch 값 (deg)
    image: UploadFile = File(...)          # 이미지 파일
):
    # 1) pitch 유효성 확인
    if abs(camera_pitch) > MAX_PITCH_DEG:
        return JSONResponse(
            {"success": False,
             "error": f"기울기가 너무 큽니다: {camera_pitch:.1f}° (허용 ±{MAX_PITCH_DEG}°)"},
            status_code=400
        )

    # 2) 이미지 디코딩
    data = await image.read()
    img = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        return JSONResponse({"success": False, "error": "이미지 디코딩 실패"}, status_code=400)
    
    # 3) 왜곡 보정
    if cam_mtx is not None and cam_dist is not None:
        img = cv2.undistort(img, cam_mtx, cam_dist)

    # 4) 사람 검출
    res = person_model(img, conf=0.1)[0]
    boxes = res.boxes.xyxy.cpu().numpy()
    clss = res.boxes.cls.cpu().numpy().astype(int)
    idxs = np.where(clss == 0)[0]
    if idxs.size < 2:
        return JSONResponse({"success": False, "error": "두 사람 미검출"}, status_code=400)

    # 5) 픽셀 높이 기준 정렬
    heights = [(i, boxes[i, 3] - boxes[i, 1]) for i in idxs]
    heights.sort(key=lambda x: x[1], reverse=True)
    ref_i, ref_px = heights[0]
    child_i, child_px = heights[1]

    # 6) focal length (fy) 계산
    if cam_mtx is not None:
        f_px = cam_mtx[1, 1]  # 세로 방향 focal length
    else:
        f_px = img.shape[0] / 2  # 기본 focal length 추정

    # 7) 기준 사람의 거리리까지 거리 추정
    D_ref = (f_px * ref_height) / ref_px

    # 8) 아이 키 계산 (pitch 보정 포함)
    raw_child_height = (child_px * D_ref) / f_px
    pitch_rad = math.radians(camera_pitch)
    child_height = raw_child_height / math.cos(pitch_rad)

    # 9) 결과 이미지 생성
    ann = img.copy()
    for idx, color in [(ref_i, (0, 0, 255)), (child_i, (255, 0, 0))]:
        x1, y1, x2, y2 = boxes[idx].astype(int)
        cv2.rectangle(ann, (x1, y1), (x2, y2), color, 3)
    b64_ann = encode_b64(ann)

    return JSONResponse({
        "success": True,
        "distance_dad_cm": round(D_ref, 1),
        "child_height_cm": round(child_height, 1),
        "annotated_image": b64_ann
    })
