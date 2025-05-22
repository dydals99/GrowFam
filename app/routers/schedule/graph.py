from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.database import get_db
from app.models import Schedule, ScheduleCheck, Family, ScheduleCheckLog, User
from datetime import datetime, timedelta

router = APIRouter(
    prefix="/graph",
    tags=["graph"]
)

@router.get("/family-progress", response_model=list)
def get_family_progress(db: Session = Depends(get_db)):
    try:
        results = (
            db.query(
                User.user_nickname,
                func.sum(Schedule.schedule_total_count).label("total_missions"),
                func.sum(ScheduleCheck.schedule_check_count).label("completed_missions")
            )
            .join(Family, Family.family_no == Schedule.family_no)
            .join(User, User.user_no == Family.user_no)
            .join(ScheduleCheck, Schedule.schedule_no == ScheduleCheck.schedule_no)
            .group_by(User.user_nickname)
            .all()
        )

        family_progress = []
        for result in results:
            user_nickname, total_missions, completed_missions = result
            progress = (completed_missions / total_missions * 100) if total_missions > 0 else 0
            family_progress.append({
                "user_nickname": user_nickname,
                "progress": round(progress, 1)
            })

        # 퍼센트 기준으로 내림차순 정렬
        family_progress.sort(key=lambda x: x["progress"], reverse=True)

        return family_progress

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"가족 진행률 계산 실패: {str(e)}")
    
@router.get("/family-stats/{family_no}")
def get_family_stats(
    family_no: int,
    db: Session = Depends(get_db)
):
    try:
        # 1. 전체 가족별 진행률 리스트 및 내 가족 진행률 찾기
        all_families = (
            db.query(
                Schedule.family_no,
                func.sum(Schedule.schedule_total_count).label("total_missions"),
                func.sum(ScheduleCheck.schedule_check_count).label("completed_missions")
            )
            .join(ScheduleCheck, Schedule.schedule_no == ScheduleCheck.schedule_no)
            .group_by(Schedule.family_no)
            .all()
        )
        progress_list = []
        my_progress = 0
        for fam in all_families:
            fam_no = fam[0]
            fam_total = fam[1] or 0
            fam_completed = fam[2] or 0
            fam_progress = (fam_completed / fam_total * 100) if fam_total > 0 else 0
            progress_list.append({"family_no": fam_no, "progress": fam_progress})
            if fam_no == family_no:
                my_progress = fam_progress

        progress_values = [item["progress"] for item in progress_list]

        # 2. 전체 평균 진행률
        avg_progress = sum(progress_values) / len(progress_values) if progress_values else 0

        # 3. 상위 10% 가족 평균
        sorted_progress = sorted(progress_values, reverse=True)
        top_10_count = max(1, int(len(sorted_progress) * 0.1))
        top10_progress = sum(sorted_progress[:top_10_count]) / top_10_count if top_10_count > 0 else 0

        # 4. 우리 가족의 순위 퍼센트 (상위 몇 %)
        my_rank = sorted_progress.index(my_progress) + 1 if my_progress in sorted_progress else len(sorted_progress)
        my_rank_percent = round(my_rank / len(sorted_progress) * 100, 1) if sorted_progress else 100
        total_families = len(sorted_progress)

        # 5. 이번 주 우리 가족 목표 달성일 수
        today = datetime.now()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        weekly_completed = (
            db.query(ScheduleCheckLog.schedule_check_date_log)
            .join(Schedule, Schedule.family_no == ScheduleCheckLog.family_no)
            .filter(
                Schedule.family_no == family_no,
                ScheduleCheckLog.schedule_check_date_log >= start_of_week.date(),
                ScheduleCheckLog.schedule_check_date_log <= end_of_week.date()
            )
            .distinct()
            .count()
        )

        return {
            "myProgress": round(my_progress, 1),
            "avgProgress": round(avg_progress, 1),
            "top10Progress": round(top10_progress, 1),
            "weeklyCompleted": weekly_completed,
            "myRankPercent": my_rank_percent,
            "myRank": my_rank,                # 추가: 내 등수
            "totalFamilies": total_families   # 추가: 전체 가족 수
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"가족 통계 계산 실패: {str(e)}")