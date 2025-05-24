from calendar import monthrange
from typing import List
from fastapi import APIRouter, Body, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import  date, time
import datetime
from pydantic import BaseModel
from app.database import get_db 
from app.models import Schedule, ScheduleCheck,ScheduleCheckLog, UserPushToken
from app.schemas import ScheduleCheckLogResponse, ScheduleCreate
import requests
from apscheduler.schedulers.background import BackgroundScheduler

router = APIRouter(
    prefix="/schedule",
    tags=["schedule"])

scheduler = BackgroundScheduler()
scheduler.start()

def send_expo_push(token: str, title: str, body: str):
    url = "https://exp.host/--/api/v2/push/send"
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    data = {
        "to": token,
        "title": title,
        "body": body,
        "sound": "default"
    }
    try:
        response = requests.post(url, json=data, headers=headers)
        return response.json()
    except Exception as e:
        print("Expo Push Error:", e)
        return None
    
def schedule_push_daily(token, title, body, start_time):
    scheduler.add_job(
        send_expo_push,
        'interval',
        days=1,
        start_date=start_time,
        args=[token, title, body],
        id=f"{token}_{start_time}",  # 중복 예약 방지용 id
        replace_existing=True
    )
@router.post("/push-token")
def save_push_token(
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    user_no = data.get("user_no")
    push_token = data.get("push_token")
    if not user_no or not push_token:
        raise HTTPException(status_code=400, detail="user_no와 push_token이 필요합니다.")

    # 이미 토큰이 있으면 업데이트, 없으면 생성
    token_obj = db.query(UserPushToken).filter(UserPushToken.user_no == user_no).first()
    if token_obj:
        token_obj.push_token = push_token
    else:
        token_obj = UserPushToken(user_no=user_no, push_token=push_token)
        db.add(token_obj)
    db.commit()
    return {"message": "푸시 토큰 저장 완료"}

@router.get("/{family_no}", response_model=List[dict])
def get_schedules(family_no: int, db: Session = Depends(get_db)):
    schedules = (
        db.query(Schedule, ScheduleCheck)
        .join(ScheduleCheck, Schedule.schedule_no == ScheduleCheck.schedule_no)
        .filter(Schedule.family_no == family_no)
        .all()
    )

    result = []
    for schedule, check in schedules:
        result.append({
            "scheduleNo": schedule.schedule_no,
            "scheduleContent": schedule.schedule_cotents,
            "scheduleDate": schedule.schedule_date.strftime("%Y-%m-%d"),
            "totalCount": schedule.schedule_total_count,
            "completedCount": check.schedule_check_count,
            "lastCheckDate": check.schedule_check_date.strftime("%Y-%m-%d") if check.schedule_check_date else None,
        })
    return result

@router.post("/write", response_model=dict)
def create_schedule(schedule_data: ScheduleCreate, db: Session = Depends(get_db)):
    try:
        today = date.today()
        schedule_date = schedule_data.schedule_date.date()
        remaining_days = (schedule_date.replace(day=monthrange(schedule_date.year, schedule_date.month)[1]) - today).days + 1

        if remaining_days < 0:
            remaining_days = 0

        # tb_schedule에 데이터 삽입 (schedule_time 추가)
        schedule_time_obj = datetime.time.fromisoformat(schedule_data.schedule_time)
        new_schedule = Schedule(
            family_no=schedule_data.family_no,
            schedule_cotents=schedule_data.schedule_cotents,
            schedule_date=schedule_data.schedule_date,
            schedule_time=schedule_time_obj, 
            schedule_total_count=remaining_days
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)

        # tb_schedule_check에 기본값으로 데이터 삽입
        new_schedule_check = ScheduleCheck(
            schedule_no=new_schedule.schedule_no,
            schedule_check_count=0
        )
        db.add(new_schedule_check)
        db.commit()

        # tb_schedule_check_log에 기본 로그 추가
        new_schedule_check_log = ScheduleCheckLog(
            family_no=schedule_data.family_no,
            # 필요한 필드 추가
        )
        db.add(new_schedule_check_log)
        db.commit()

        # 가족 구성원의 푸시 토큰 조회 (family_no 컬럼이 없으면 user_no로 조회)
        user_tokens = db.query(UserPushToken.push_token).all()

        # 반복 예약 발송 시간 계산
        if isinstance(schedule_data.schedule_date, str):
            schedule_date_obj = datetime.datetime.fromisoformat(schedule_data.schedule_date)
        else:
            schedule_date_obj = schedule_data.schedule_date

        if isinstance(schedule_data.schedule_time, str):
            schedule_time_obj = datetime.time.fromisoformat(schedule_data.schedule_time)
        else:
            schedule_time_obj = schedule_data.schedule_time

        start_time = datetime.datetime.combine(
            schedule_date_obj.date(),
            schedule_time_obj
        )
        print("매일 반복 예약 시작 시간:", start_time)

        for (token,) in user_tokens:
            print("매일 반복 푸시 예약:", token, start_time)
            schedule_push_daily(
                token,
                title="일정 알림",
                body=f"{schedule_data.schedule_cotents} ({schedule_data.schedule_time})",
                start_time=start_time
            )

        return {
            "scheduleNo": new_schedule.schedule_no,
            "scheduleContent": new_schedule.schedule_cotents,
            "scheduleDate": new_schedule.schedule_date,
            "scheduleTime": str(new_schedule.schedule_time),
            "scheduleTotalCount": new_schedule.schedule_total_count,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"일정 등록 실패: {str(e)}")


@router.patch("/check/{schedule_no}", response_model=dict)
def update_schedule_check(
    schedule_no: int,
    increment: int = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    schedule_check = db.query(ScheduleCheck).filter(ScheduleCheck.schedule_no == schedule_no).first()
    schedule = db.query(Schedule).filter(Schedule.schedule_no == schedule_no).first()

    if not schedule_check or not schedule:
        raise HTTPException(status_code=404, detail="해당 일정이 존재하지 않습니다.")

    today = date.today()

    # 오늘 이미 체크했는지 확인
    if schedule_check.schedule_check_date == today:
        raise HTTPException(status_code=400, detail="오늘은 이미 체크했습니다.")

    # 체크 업데이트
    schedule_check.schedule_check_count += increment
    schedule_check.schedule_check_date = today  # 마지막 체크 날짜 업데이트

    # tb_schedule_check_log에 기록 추가
    new_log = ScheduleCheckLog(
        family_no=schedule.family_no,
        schedule_check_date_log=today
    )
    db.add(new_log)

    db.commit()
    db.refresh(schedule_check)

    return {
        "schedule_no": schedule_no,
        "schedule_check_count": schedule_check.schedule_check_count,
    }
    
@router.get("/check-logs/{family_no}", response_model=List[ScheduleCheckLogResponse])
def get_schedule_check_logs(family_no: int, db: Session = Depends(get_db)):
    logs = (
        db.query(ScheduleCheckLog)
        .filter(ScheduleCheckLog.family_no == family_no)
        .all()
    )
    if not logs:
        raise HTTPException(status_code=404, detail="체크 로그를 찾을 수 없습니다.")
    
    # 반환 데이터 확인
    return [
        {
            "family_no": log.family_no,
            "schedule_check_date_log": log.schedule_check_date_log,  # None 값 허용
            "schedule_check_date_log_no": log.schedule_check_date_log_no,
        }
        for log in logs
    ]

