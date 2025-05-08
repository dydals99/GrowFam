from fastapi import APIRouter, File, UploadFile, Form
from fastapi.responses import JSONResponse
import numpy as np
import cv2
import base64
from ultralytics import YOLO

router = APIRouter()

# Detect 전용 COCO person 모델
person_model = YOLO("yolov8n.pt", task="detect")

def encode_b64(img: np.ndarray) -> str:
    _, buf = cv2.imencode('.jpg', img)
    return base64.b64encode(buf).decode('utf-8')

@router.post("/estimate-child-height")
async def estimate_child_height(
    dad_height:    float      = Form(...),    # 아빠 키(cm)
    image:         UploadFile = File(...)
):
    try:
        # 1) 이미지 디코딩
        data = await image.read()
        img  = cv2.imdecode(np.frombuffer(data, np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse({"success": False, "error": "이미지 디코딩 실패"})

        # 2) 사람 검출 (모두 검출)
        res = person_model(img, conf=0.1)[0]
        boxes = res.boxes.xyxy.cpu().numpy()      # (N, 4)
        confs = res.boxes.conf.cpu().numpy().flatten()
        clss  = res.boxes.cls.cpu().numpy().astype(int).flatten()

        # coco person 클래스 id == 0
        idxs = np.where(clss == 0)[0]
        if idxs.size < 2:
            return JSONResponse({"success": False, "error": "두 사람 미검출"})

        # 3) 픽셀 높이 기준 내림차순 정렬
        heights = [(i, boxes[i,3] - boxes[i,1]) for i in idxs]
        heights.sort(key=lambda x: x[1], reverse=True)
        dad_idx, dad_pix_h   = heights[0]
        child_idx, child_pix_h = heights[1]

        # 4) 보정 계수 계산 & 아이 키 추정
        px_per_cm   = dad_pix_h / dad_height
        child_height = child_pix_h / px_per_cm

        # 5) 시각화 (아빠=빨강, 아이=파랑)
        ann = img.copy()
        x1,y1,x2,y2 = boxes[dad_idx].astype(int)
        cv2.rectangle(ann, (x1,y1), (x2,y2), (0,0,255), 3)
        x1,y1,x2,y2 = boxes[child_idx].astype(int)
        cv2.rectangle(ann, (x1,y1), (x2,y2), (255,0,0), 3)

        b64_ann = encode_b64(ann)

        return JSONResponse({
            "success":          True,
            "child_height_cm":  round(child_height, 1),
            "annotated_image":  b64_ann
        })
    except Exception as e:
        return JSONResponse({"success": False, "error": str(e)})
