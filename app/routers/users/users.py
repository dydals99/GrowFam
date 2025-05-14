from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Family
from app.schemas import UserCreate
from passlib.context import CryptContext
import random
import string
from fastapi.responses import RedirectResponse
import smtplib
from email.mime.text import MIMEText
from app.utils import create_access_token, get_current_user
from app.schemas import NicknameRequest, EmailVerificationRequest, EmailVerificationConfirmRequest, LoginRequest, UpdateUserInfoRequest
from datetime import timedelta
import shutil

# Token expiration time in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 이메일 인증 코드 저장소
email_verification_codes = {}

# 이메일 전송 함수
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "whdydals8604@gmail.com"  # 발신 이메일 주소
EMAIL_PASSWORD = "jelu brbu lnuq otnh"  # Gmail 앱 비밀번호로 업데이트

def send_email(to_email: str, code: str):
    try:
        subject = "GrowFam 인증코드"
        body = f"안녕하세요 당신의 인증코드는 : {code}"

        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = EMAIL_ADDRESS
        msg["To"] = to_email

        print("Connecting to SMTP server...")  # 디버깅 로그 추가
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            print("Logging in to SMTP server...")  # 디버깅 로그 추가
            server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            print("Sending email...")  # 디버깅 로그 추가
            server.sendmail(EMAIL_ADDRESS, to_email, msg.as_string())
        print("Email sent successfully.")  # 디버깅 로그 추가
    except Exception as e:
        print(f"Error sending email: {e}")  # 디버깅 로그 추가
        raise

@router.post("/check-nickname")
def check_nickname(request: NicknameRequest, db: Session = Depends(get_db)):
    
    existing_user = db.query(User).filter(User.user_nickname == request.nickname).first()
    if (existing_user):
        return {"isValid": False}
    return {"isValid": True}

@router.post("/send-email-verification")
def send_email_verification(request: EmailVerificationRequest):
    # 인증 코드 생성
    code = ''.join(random.choices(string.digits, k=6))
    email_verification_codes[request.email] = code

    # 이메일 전송
    try:
        send_email(request.email, code)
        return {"success": True, "message": "Verification email sent."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@router.post("/verify-email-code")
def verify_email_code(request: EmailVerificationConfirmRequest):
    # 디버깅 로그 추가
    print(f"Verification attempt for email: {request.email}")
    print(f"Provided code: {request.code}")
    print(f"Expected code: {email_verification_codes.get(request.email)}")

    # 이메일과 코드가 일치하는지 확인
    if email_verification_codes.get(request.email) == request.code:
        del email_verification_codes[request.email]  # 인증 코드 삭제
        print("Verification successful")  # 디버깅 로그 추가
        return {"success": True, "message": "Email verified successfully."}

    print("Verification failed")  # 디버깅 로그 추가
    raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

@router.get("/verify-email-link/{email}/{code}")
def verify_email_link(email: str, code: str):
    # 이메일과 코드가 일치하는지 확인
    if email_verification_codes.get(email) == code:
        del email_verification_codes[email]  # 인증 코드 삭제
        return RedirectResponse(url="https://your-app-url.com/email-verified")
    raise HTTPException(status_code=400, detail="Invalid or expired verification link.")

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    print(f"Received registration request: {user}")  # 디버깅 로그 추가

    # 닉네임 중복 확인
    existing_user = db.query(User).filter(User.user_nickname == user.user_nickname).first()
    if existing_user:
        print("Nickname already taken")  # 디버깅 로그 추가
        raise HTTPException(status_code=400, detail="Nickname already taken")

    # 비밀번호 암호화
    hashed_password = pwd_context.hash(user.user_password)

    # 사용자 생성
    new_user = User(
        user_name=user.user_name,
        user_nickname=user.user_nickname,
        user_email=user.user_email,
        user_password=hashed_password
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 가족 정보 생성
    adjectives = ["똑똑한", "용감한", "친절한", "행복한", "사려깊은", "밝은", "따뜻한", "재미있는"]
    animals = ["돌고래네", "호랑이네", "사자네", "토끼네", "코끼리네", "여우네", "펭귄네", "부엉이네"]

    random_family_nickname = f"{random.choice(adjectives)} {random.choice(animals)}"  # 랜덤 닉네임 생성
    new_family = Family(
        user_no=new_user.user_no,
        family_nickname=random_family_nickname
    )
    db.add(new_family)
    db.commit()
    db.refresh(new_family)

    print(f"User registered successfully: {new_user.user_no}, Family created: {new_family.family_no}")  # 디버깅 로그 추가
    return {"success": True, "user_no": new_user.user_no, "family_no": new_family.family_no}

@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_email == request.email).first()
    if not user or not pwd_context.verify(request.password, user.user_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # DB에서 user_no 가져오기
    user_no = user.user_no

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.user_email, "user_no": user_no},  # user_no 포함
        expires_delta=access_token_expires
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_no": user_no  # user_no 추가
    }

@router.get("/user-info/{user_no}")
def get_user_info(user_no: int, db: Session = Depends(get_db)):
    """
    user_no를 기반으로 사용자 정보를 반환하는 API
    """
    user = db.query(User).filter(User.user_no == user_no).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_no": user.user_no,
        "email": user.user_email,
        "nickname": user.user_nickname,
        "username": user.user_name,
        "profileImage": user.user_profile
    }

@router.post("/update-user-info")
def update_user_info(request: UpdateUserInfoRequest, db: Session = Depends(get_db)):
    """
    사용자 정보를 동적으로 업데이트하는 API
    """
    valid_fields = {"username": "user_name", "nickname": "user_nickname", "email": "user_email", "password": "user_password"}
    
    # 유효한 필드인지 확인
    if request.field not in valid_fields:
        raise HTTPException(status_code=400, detail="Invalid field")

    # 사용자 조회
    user = db.query(User).filter(User.user_no == request.user_no).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 비밀번호 필드 처리
    if request.field == "password":
        hashed_password = pwd_context.hash(request.value)  # 비밀번호 암호화
        setattr(user, valid_fields[request.field], hashed_password)
    else:
        # 다른 필드 처리
        setattr(user, valid_fields[request.field], request.value)

    db.commit()

    return {"success": True, "message": f"{request.field.capitalize()} updated successfully"}

@router.post("/update-profile-image")
def update_profile_image(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db), file: UploadFile = File(...)):
    user_no = current_user.get("user_no")
    user = db.query(User).filter(User.user_no == user_no).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 파일 저장 경로 설정
    file_location = f"static/uploaded_user_profile/{user_no}_{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # DB에 프로필 이미지 경로 업데이트
    user.user_profile = file_location
    db.commit()

    return {"success": True, "message": "Profile image updated successfully", "profileImage": file_location}

@router.get("/family/{user_no}")
def get_family_info(user_no: int, db: Session = Depends(get_db)):
    
    family = db.query(Family).filter(Family.user_no == user_no).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")

    return {
        "family_no": family.family_no,
        "family_nickname": family.family_nickname
    }