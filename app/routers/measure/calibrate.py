import cv2
import numpy as np
import glob
import os

# === 설정 ===
chessboard_size = (10, 7) 
square_size = 2.5         # 한 칸의 실제 크기 (단위: cm or arbitrary)
image_folder = './calibration_images'  # 캘리브레이션 이미지 경로
output_path = 'camera_params.npz'  # 저장 파일명

# === 월드 좌표계의 체스보드 좌표 준비 ===
objp = np.zeros((chessboard_size[1]*chessboard_size[0], 3), np.float32)
objp[:, :2] = np.indices(chessboard_size).T.reshape(-1, 2)
objp *= square_size

objpoints = []  # 실제 3D 좌표
imgpoints = []  # 이미지 상의 2D 좌표

# === 이미지 읽기 ===
images = glob.glob(os.path.join(image_folder, '*.jpg'))

for fname in images:
    img = cv2.imread(fname)
    if img is None:
        continue
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # 코너 찾기
    ret, corners = cv2.findChessboardCorners(gray, chessboard_size, None)

    if ret:
        objpoints.append(objp)
        refined = cv2.cornerSubPix(gray, corners, (11,11), (-1,-1),
                                   criteria=(cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 30, 0.001))
        imgpoints.append(refined)

        # 시각화
        vis = cv2.drawChessboardCorners(img, chessboard_size, refined, ret)
        cv2.imshow('Chessboard', vis)
        cv2.waitKey(100)

cv2.destroyAllWindows()

# === 카메라 캘리브레이션 ===
ret, mtx, dist, rvecs, tvecs = cv2.calibrateCamera(objpoints, imgpoints, gray.shape[::-1], None, None)

print("카메라 행렬 (mtx):\n", mtx)
print("왜곡 계수 (dist):\n", dist)

# === 결과 저장 ===
np.savez(output_path, mtx=mtx, dist=dist)
print(f"카메라 파라미터 저장 완료: {output_path}")
