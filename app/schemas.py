from typing import Optional, List
from pydantic import BaseModel, EmailStr
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

class CommunityImageOut(BaseModel):
    image_no: int
    image_path: str

class CommunityOut(BaseModel):
    community_no: int
    community_title: str
    community_content: str
    user_no: int
    community_regist_at: datetime
    like_count: int
    user_nickname: str
    images: Optional[List[CommunityImageOut]] = []  # ← 이 부분 추가

    class Config:
        from_attributes = True
    
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

class CommunityComentImageOut(BaseModel):
    coment_image_no: int
    coment_image_path: str

    class Config:
        from_attributes = True

class CommunityComentOut(CommunityComentBase):
    coment_no: int
    coment_regist_at: datetime
    user_nickname: str
    images: Optional[List[CommunityComentImageOut]] = []  # 추가

    class Config:
        from_attributes = True
        
class ComentUpdateRequest(BaseModel):
    coment_content: str

class ComentResponse(BaseModel):
    coment_no: int
    coment_content: str
    coment_regist_at: str
    user_no: int
    community_no: int

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
    family_no: int
    schedule_check_date_log: Optional[datetime]  # None 값을 허용
    schedule_check_date_log_no: int

    class Config:
        from_attributes = True


class KidInfoRequest(BaseModel):
    kid_name: str
    kid_birthday: str
    kid_gender: str
    kid_height: str
    kid_weight: str

class RegisterAllRequest(BaseModel):
    user_name: str
    user_nickname: str
    user_email: str
    user_password: str
    user_phone: str
    kids: List[KidInfoRequest]
    
    
class NicknameRequest(BaseModel):
    nickname: str

class EmailCheckRequest(BaseModel):
    email: str
    
class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirmRequest(BaseModel):
    email: EmailStr
    code: str

class LoginRequest(BaseModel):
    email: str
    password: str

class UpdateUserInfoRequest(BaseModel):
    user_no: int
    field: str
    value: str

class FindIdRequest(BaseModel):
    user_name: str
    user_phone: str

class FindPwRequest(BaseModel):
    user_email: str

class PhoneCheckRequest(BaseModel):
    phone: str
    
# Family 관련 클래스 
class FamilyBase(BaseModel):
    family_nickname: Optional[str]

class FamilyCreate(BaseModel):
    user_no: int  
    
class Family(FamilyBase):
    family_no: int
    family_regist_at: datetime

    class Config:
        from_attributes = True


class FamilyMonthGoalsBase(BaseModel):
    month_golas_contents: str

class FamilyMonthGoals(FamilyMonthGoalsBase):
    month_golas_no: int

    class Config:
        from_attributes = True


class KidInfoBase(BaseModel):
    kid_height: str
    kid_weight: str
    kid_gender: str
    kid_birthday: str

class KidInfoCreate(BaseModel):
    family_no: int
    kid_name: str
    kid_birthday: str
    kid_gender: str
    kid_height: str
    kid_weight: str

class KidDeleteRequest(BaseModel):
    kid_info_no: int
    
class KidInfo(KidInfoBase):
    kid_info_no: int
    kid_info_regist_at: datetime

    class Config:
        from_attributes = True

class KidInfoUpdate(BaseModel):
    kid_info_no: int
    kid_name: str
    kid_birthday: str
    kid_gender: str
    kid_height: str
    kid_weight: str
    kid_info_regist_at: Optional[datetime] = None  
    
class CompareRequest(BaseModel):
    ageInMonths: int
    height: float
    weight: float
    gender: int
    

    @classmethod
    def __get_validators__(cls):
        yield cls.validate_gender

    @classmethod
    def validate_gender(cls, value):
        if isinstance(value, str):
            try:
                return int(value)
            except ValueError:
                raise ValueError("gender 필드는 정수여야 합니다.")
        return value