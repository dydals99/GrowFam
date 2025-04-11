from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.database import get_db
from app.models import Schedule, ScheduleCheck, Family

router = APIRouter(
    prefix="/graph",
    tags=["graph"]
)

@router.get("/family-progress", response_model=list)
def get_family_progress(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                Family.famliy_nickname,
                func.sum(Schedule.schedule_total_count).label("total_missions"),
                func.sum(ScheduleCheck.schedule_check_count).label("completed_missions")
            )
            .join(Schedule, Family.famliy_no == Schedule.famliy_no)
            .join(ScheduleCheck, Schedule.schedule_no == ScheduleCheck.schedule_no)
            .group_by(Family.famliy_nickname)
            .all()
        )

        family_progress = []
        for result in results:
            family_nickname, total_missions, completed_missions = result
            progress = (completed_missions / total_missions * 100) if total_missions > 0 else 0
            family_progress.append({
                "family_nickname": family_nickname,
                "progress": round(progress, 2)  
            })

        # 퍼센트 기준으로 내림차순 정렬
        family_progress.sort(key=lambda x: x["progress"], reverse=True)

        return family_progress

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"가족 진행률 계산 실패: {str(e)}")