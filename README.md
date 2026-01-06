# GrowFam !!
## OpenCV와 FastAPI를 활용한 영유아 성장 관리 및 키 측정 서비스

### 프로젝트 개요
전문적인 키 측정 기계를 활용하기 어려운 환경에 부모가 간편하게 아이의 성장을 관리할 수 있는 앱입니다.<br>
이미지 기반의 자동 키 측정 기술과 데이터 시각화를 통해 아이의 성장 과정을 체계적으로 관리합니다.

### 주요 기능
1. 키 측정
객체 검출(Object Detection): OpenCV를 활용하여 입력된 이미지에서 사람 객체를 정밀하게 검출합니다.<br>
높이 추정 알고리즘: 검출된 객체 간의 상대적 높이 비율을 계산하여 실제 키를 측정하거나 이전 기록과 비교합니다.

2. 성장 데이터 관리
리스트 뷰: 날짜별로 기록된 성장을 한눈에 확인할 수 있는 히스토리 기능을 제공합니다.<br>
그래프 시각화: 누적된 데이터를 선 그래프 형식으로 제공하여 성장의 흐름을 직관적으로 파악할 수 있습니다.

3. 통계 및 비교분석
또래 비교 기능: 공공데이터를 기반으로 동일 연령대 아이들과의 성장 수치를 비교하여 현재 발달 상태를 체크합니다.

## 기술 스택
### Backend<br>

Python : 메인 로직 개발<br>
FastAPI : 비동기 REST API 서버<br>
OpenCV : 이미지 프로세싱 및 객체 검출

### Frontend<br>

React Native (Expo) : 크로스 플랫폼 모바일 앱 개발

## 프로세스 
<img width="300" height="320" alt="" src="https://github.com/user-attachments/assets/9dedc366-dafa-41cb-9610-6c191e9ea04a" />

## 결과화면 및 성능표 
<img width="233" height="400" alt="" src="https://github.com/user-attachments/assets/26f45d8d-08eb-4f10-8642-a86f7c66c3df" />
<img width="232" height="400" alt="" src="https://github.com/user-attachments/assets/63f529a7-0adc-4169-b00d-43937f90deda" />
<img width="232" height="400" alt="" src="https://github.com/user-attachments/assets/dd22233e-2d13-46e4-9ec1-121696b193a4" /><br>
<img width="200" height="400" alt="" src="https://github.com/user-attachments/assets/a8933441-1cbe-47be-81de-7e90e7795055" />
<img width="500" height="450" alt="스크린샷 2026-01-06 161508" src="https://github.com/user-attachments/assets/2972940e-538a-4530-83d6-bb890a3261fa" />

