from calendar import monthrange
from typing import List
from fastapi import APIRouter, Body, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, date, timedelta
from pydantic import BaseModel
from app.database import get_db 
from app.models import Schedule, ScheduleCheck
from app.models import FamilyMonthGoal


router = APIRouter(
    prefix="/schedule",
    tags=["schedule"])

class ScheduleCreate(BaseModel):
    famliy_no: int
    schedule_cotents: str
    schedule_date: datetime
    schedule_check_count: int

@router.get("/{famliy_no}", response_model=List[dict])
def get_schedules(famliy_no: int, db: Session = Depends(get_db)):
    schedules = (
        db.query(Schedule, ScheduleCheck)
        .join(ScheduleCheck, Schedule.schedule_no == ScheduleCheck.schedule_no)
        .filter(Schedule.famliy_no == famliy_no)
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
        # 남은 날짜 계산
        today = date.today()
        schedule_date = schedule_data.schedule_date.date()
        remaining_days = (schedule_date.replace(day=monthrange(schedule_date.year, schedule_date.month)[1]) - today).days + 1

        if remaining_days < 0:
            remaining_days = 0

        # tb_schedule에 데이터 삽입
        new_schedule = Schedule(
            famliy_no=schedule_data.famliy_no,
            schedule_cotents=schedule_data.schedule_cotents,
            schedule_date=schedule_data.schedule_date,
            schedule_total_count=remaining_days  # 총 체크 가능한 횟수 저장
        )
        db.add(new_schedule)
        db.commit()
        db.refresh(new_schedule)

        # tb_schedule_check에 기본값으로 데이터 삽입
        new_schedule_check = ScheduleCheck(
            schedule_no=new_schedule.schedule_no,
            schedule_check_count=0  # 기본값 0
        )
        db.add(new_schedule_check)
        db.commit()

        return {
            "scheduleNo": new_schedule.schedule_no,
            "scheduleContent": new_schedule.schedule_cotents,
            "scheduleDate": new_schedule.schedule_date,
            "scheduleTotalCount": new_schedule.schedule_total_count,
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"일정 등록 실패: {str(e)}")

@router.get("/family-goal/{famliy_no}", response_model=dict)
def get_family_goal(famliy_no: int, db: Session = Depends(get_db)):
    family_goal = db.query(FamilyMonthGoal).filter(FamilyMonthGoal.famliy_no == famliy_no).first()
    if not family_goal:
        raise HTTPException(status_code=404, detail="해당 가족의 목표가 존재하지 않습니다.")
    return {"month_golas_contents": family_goal.month_golas_contents}


@router.patch("/check/{schedule_no}", response_model=dict)
def update_schedule_check(
    schedule_no: int,
    increment: int = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    schedule_check = db.query(ScheduleCheck).filter(ScheduleCheck.schedule_no == schedule_no).first()

    if not schedule_check:
        raise HTTPException(status_code=404, detail="해당 일정이 존재하지 않습니다.")

    today = date.today()

    # 오늘 이미 체크했는지 확인
    if schedule_check.schedule_check_date == today:
        raise HTTPException(status_code=400, detail="오늘은 이미 체크했습니다.")

    # 체크 업데이트
    schedule_check.schedule_check_count += increment
    schedule_check.schedule_check_date = today  # 마지막 체크 날짜 업데이트
    db.commit()
    db.refresh(schedule_check)

    return {
        "schedule_no": schedule_no,
        "schedule_check_count": schedule_check.schedule_check_count,
    }


