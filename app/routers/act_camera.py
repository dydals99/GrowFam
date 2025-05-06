from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2
import base64
from ultralytics import YOLO

router = APIRouter()
shoe_model   = YOLO("models/mybest.pt")
person_model = YOLO("yolov8n.pt")

@router.post("/estimate-height")
async def estimate_height(
    shoe_size: float = Form(...),
    image: UploadFile = File(...)
):
    try:
        # 1. 이미지 디코딩
        img_bytes = await image.read()
        np_img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
        if np_img is None:
            return JSONResponse({"success": False, "error": "디코딩 실패"})

        # 2. 신발 검출
        sres = shoe_model(np_img)[0]
        if not sres.boxes:
            return JSONResponse({"success": False, "error": "신발 미검출"})
        sx1, sy1, sx2, sy2 = map(int, sres.boxes[0].xyxy[0])
        pixel_shoe_w = sx2 - sx1

        # 3. 사람 검출
        pres = person_model(np_img)[0]
        if not pres.boxes:
            return JSONResponse({"success": False, "error": "사람 미검출"})
        px1, py1, px2, py2 = map(int, pres.boxes[0].xyxy[0])
        pixel_person_h = py2 - py1

        # 4. 키 계산
        pixel_shoe_h = sy2 - sy1  # 신발 바운딩 박스의 높이 계산
        if pixel_shoe_h <= 0 or shoe_size <= 0:
            return JSONResponse({"success": False, "error": "신발 크기 또는 바운딩 박스 오류"})

        ratio = pixel_shoe_h / shoe_size   # px per cm
        height_cm = pixel_person_h / ratio

        # 디버깅 로그 출력
        print(f"픽셀 신발 높이: {pixel_shoe_h}, 신발 사이즈: {shoe_size}, 비율: {ratio}, 픽셀 사람 높이: {pixel_person_h}, height_cm: {height_cm}")

        if height_cm <= 50 or height_cm >= 250:  # 비정상적인 키 값 필터링
            return JSONResponse({"success": False, "error": "비정상적인 키 계산 결과"})

        # 5. 바운딩 박스 시각화
        annotated = np_img.copy()
        cv2.rectangle(annotated, (sx1, sy1), (sx2, sy2), (0,255,0), 2)   # 신발: 녹색
        cv2.rectangle(annotated, (px1, py1), (px2, py2), (255,0,0), 2)   # 사람: 파란색

        # JPEG 인코딩 → base64
        _, buffer = cv2.imencode('.jpg', annotated)
        jpg_as_text = base64.b64encode(buffer).decode('utf-8')

        return JSONResponse({
            "success": True,
            "height_cm": height_cm,
            "annotated_image": jpg_as_text
        })

    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})