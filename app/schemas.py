from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime


# Community 관련 클래스
class CommunityCreate(BaseModel):
    community_no: Optional[int] = None
    community_title: str
    community_content: str
    user_no: int
    community_regist_at: Optional[datetime] = None
    like_count: Optional[int] = 0

class CommunityUpdate(BaseModel):
    community_title: Optional[str] = None
    community_content: Optional[str] = None

class CommunityOut(BaseModel):
    community_no: int
    community_title: str
    community_content: str
    user_no: int
    community_regist_at: datetime
    like_count: int
    user_nickname: str
    
    class Config:
        from_attributes = True

class CommunityLikeCreate(BaseModel):
    community_no: int
    user_no: int

class CommunityLikeOut(BaseModel):
    id: int
    community_no: int
    user_no: int

    class Config:
        from_attributes = True

class CommunityComentBase(BaseModel):
    coment_content: str
    community_no: int
    user_no: int

class CommunityComentCreate(CommunityComentBase):
    pass

class CommunityComentUpdate(BaseModel):
    coment_content: Optional[str] = None

class CommunityComentOut(CommunityComentBase):
    coment_no: int
    coment_regist_at: datetime  # 필드 이름을 DB와 일치하도록 수정
    user_nickname: str  # 사용자 닉네임 추가

    class Config:
        from_attributes = True

# Schedule 관련 클래스
class ScheduleCreate(BaseModel):
    famliy_no: int
    schedule_cotents: str
    schedule_date: datetime
    schedule_check_count: int

# 일정 조회 시 사용하는 스키마
class ScheduleRead(BaseModel):
    schedule_no: int
    schedule_cotents: str
    schedule_date: datetime
    schedule_check_count: int

    class Config:
        from_attributes = True

class ScheduleCheckRead(BaseModel):
    schedule_no: int
    schedule_check_count: int

    class Config:
        from_attributes = True

class ScheduleCheckLogResponse(BaseModel):
    schedule_check_date_log_no: int
    family_no: int
    schedule_check_date_log: datetime

    class Config:
        from_attributes = True

# User 관련 클래스
class UserCreate(BaseModel):
    user_name: str
    user_nickname: str
    user_email: str
    user_password: str

    class Config:
        from_attributes = True

# Family 관련 클래스 
class FamilyBase(BaseModel):
    family_nickname: Optional[str]

class FamilyCreate(BaseModel):
    user_no: int  # user_no 필드 추가
    family_nickname: Optional[str]

class Family(FamilyBase):
    family_no: int
    family_regist_at: datetime

    class Config:
        from_attributes = True


class FamilyMonthGoalsBase(BaseModel):
    month_golas_contents: str

class FamilyMonthGoalsCreate(FamilyMonthGoalsBase):
    family_no: int

class FamilyMonthGoals(FamilyMonthGoalsBase):
    month_golas_no: int

    class Config:
        from_attributes = True


class KidInfoBase(BaseModel):
    kid_height: str
    kid_weight: str
    kid_gender: str
    kid_birthday: str

class KidInfoCreate(KidInfoBase):
    family_no: int

class KidInfo(KidInfoBase):
    kid_info_no: int
    kid_info_regist_at: datetime

    class Config:
        from_attributes = True