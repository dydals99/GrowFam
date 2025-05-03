import os
import aiofiles
import cv2
import numpy as np
import pyttsx3
import mediapipe as mp
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserPhoto
import base64

router = APIRouter(
    prefix="/act_camera",
    tags=["act_camera"]
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Mediapipe 초기화
mpPose = mp.solutions.pose
mpFaceMesh = mp.solutions.face_mesh
facemesh = mpFaceMesh.FaceMesh(max_num_faces=2)
mpDraw = mp.solutions.drawing_utils
drawing = mpDraw.DrawingSpec(thickness=1, circle_radius=1)
pose = mpPose.Pose()

face_detector = cv2.CascadeClassifier(os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml"))


# 거리 계산 관련 상수
Known_distance = 20.2  # cm
Known_width = 15.5  # cm
GREEN = (0, 255, 0)

# 초점 거리 계산 함수
def focal_Length_Finder(measured_distance, real_width, width_in_rf_image):
    return (width_in_rf_image * measured_distance) / real_width

# 거리 계산 함수
def distance_finder(Focal_Length, real_face_width, face_width_in_frame):
    return (real_face_width * Focal_Length) / face_width_in_frame

# 얼굴 데이터 추출 함수
def face_data(image):
    face_detector = cv2.CascadeClassifier(os.path.join(BASE_DIR, "haarcascade_frontalface_default.xml"))
    face_width = 0
    gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    faces = face_detector.detectMultiScale(gray_image, 1.3, 5)
    for (x, y, w, h) in faces:
        face_width = w
    return face_width

@router.websocket("/ws/distance")
async def websocket_distance(websocket: WebSocket):
    await websocket.accept()
    try:
        # 참조 이미지 로드
        ref_image_path = os.path.join(BASE_DIR, "Ref_image.jpg")
        ref_image = cv2.imread(ref_image_path)
        if ref_image is None:
            await websocket.send_text("참조 이미지 로드 실패")
            return

        # 참조 이미지에서 얼굴 감지
        ref_image_face_width = face_data(ref_image)
        if ref_image_face_width == 0:
            await websocket.send_text("참조 이미지에서 얼굴을 감지하지 못했습니다.")
            return

        # 초점 거리 계산
        focal_length = focal_Length_Finder(Known_distance, Known_width, ref_image_face_width)
        print(f"초점 거리 계산 완료: {focal_length}")

        while True:
            # 클라이언트로부터 Base64 문자열 수신
            data = await websocket.receive_text()
            # Base64 문자열을 디코딩하여 바이트 데이터로 변환
            image_data = base64.b64decode(data)
            image = cv2.imdecode(np.frombuffer(image_data, np.uint8), cv2.IMREAD_COLOR)

            # 거리 계산
            face_width_in_frame = face_data(image)
            if face_width_in_frame == 0:
                await websocket.send_text("얼굴을 감지하지 못했습니다.")
                continue

            distance = distance_finder(focal_length, Known_width, face_width_in_frame)
            distance = round(distance * 1.1)  # 거리 보정
            print(f"거리 계산 완료: {distance}")

            # 적절한 위치 유도 메시지
            if 360 <= distance <= 390:
                message = "적절한 위치에 있습니다."
            elif distance < 360:
                message = "뒤로 물러나세요."
            else:
                message = "조금 더 가까이 오세요."

            # 메시지를 클라이언트로 전송
            await websocket.send_text(f"{message} (거리: {distance}cm)")
    except WebSocketDisconnect:
        print("WebSocket 연결 종료")

# /measure_height 엔드포인트
@router.post("/measure_height")
async def measure_height(file: UploadFile):
    try:
        # 이미지 로드
        image = cv2.imdecode(np.frombuffer(await file.read(), np.uint8), cv2.IMREAD_COLOR)
        if image is None:
            raise HTTPException(status_code=400, detail="이미지 로드 실패")

        # Mediapipe를 사용한 키 측정
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        result = pose.process(img_rgb)

        if not result.pose_landmarks:
            return JSONResponse(content={"message": "포즈 랜드마크를 감지하지 못했습니다.", "height": None})

        # 랜드마크 좌표 추출
        h, w, _ = image.shape
        cx1 = cy1 = cx2 = cy2 = None
        for id, lm in enumerate(result.pose_landmarks.landmark):
            cx, cy = int(lm.x * w), int(lm.y * h)
            if id == 32 or id == 31:  # 발목
                cx1, cy1 = cx, cy
            if id == 6:  # 어깨
                cx2, cy2 = cx, cy + 20

        if cx1 and cy1 and cx2 and cy2:
            d = ((cx2 - cx1)**2 + (cy2 - cy1)**2)**0.5
            height = round(d * 0.5)  # 키 계산
            return JSONResponse(content={"message": f"키는 {height}cm입니다.", "height": height})
        else:
            return JSONResponse(content={"message": "키를 계산할 수 없습니다.", "height": None})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"오류 발생: {e}")