from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Family
from app.schemas import UserCreate
from passlib.context import CryptContext
import random
import string
from pydantic import BaseModel, EmailStr
from fastapi.responses import RedirectResponse
import smtplib
from email.mime.text import MIMEText
from app.utils import create_access_token, get_current_user
from datetime import timedelta

# Token expiration time in minutes
ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 이메일 인증 코드 저장소 (임시)
email_verification_codes = {}

class NicknameRequest(BaseModel):
    nickname: str

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirmRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    email: str
    password: str

# 이메일 전송 함수
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "whdydals8604@gmail.com"  # 발신 이메일 주소
EMAIL_PASSWORD = "jelu brbu lnuq otnh"  # Gmail 앱 비밀번호로 업데이트

def send_email(to_email: str, code: str):
    try:
        subject = "Your Verification Code"
        body = f"Your verification code is: {code}"

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
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    # 디버깅 로그 추가
    print(f"Decoded current user: {current_user}")
    return {"user_no": current_user.get("user_no"), "email": current_user.get("sub")}

@router.get("/family/{user_no}")
def get_family_no(user_no: int, db: Session = Depends(get_db)):
    # tb_users와 tb_family를 조인하여 family_no를 가져옴
    family_no = db.query(Family.family_no).join(User, User.user_no == Family.user_no).filter(User.user_no == user_no).scalar()
    if not family_no:
        raise HTTPException(status_code=404, detail="Family not found for the given user_no")
    return {"family_no": family_no}


