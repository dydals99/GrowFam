from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

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
    
    class Config:
        orm_mode = True

class CommunityLikeCreate(BaseModel):
    community_no: int
    user_no: int

class CommunityLikeOut(BaseModel):
    id: int
    community_no: int
    user_no: int

    class Config:
        orm_mode = True

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
        orm_mode = True

class ScheduleCheckRead(BaseModel):
    schedule_no: int
    schedule_check_count: int

    class Config:
        orm_mode = True

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
        orm_mode = True

class UserCreate(BaseModel):
    user_name: str
    user_nickname: str
    user_email: str
    user_password: str

    class Config:
        from_attributes = True