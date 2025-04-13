from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String, DateTime, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class UserPhoto(Base):
    __tablename__ = "tb_user_photos"
    
    file_no = Column(Integer, primary_key=True, index=True)
    file_name = Column(String, nullable=False)  # 파일명 (UUID)
    contour_path = Column(String, nullable=False)  # 윤곽선 URL 저장
    uploaded_at = Column(DateTime, server_default=func.now(), nullable=False)  # 업로드 시간


class CombineImage(Base):
    __tablename__ = "tb_combine_image"
    
    combine_image_no = Column(Integer, primary_key=True, index=True)
    combine_image_name = Column(String, nullable=False)
    combine_image_path = Column(String, nullable=False)
    combine_image_at = Column(DateTime, server_default=func.now(), nullable=False)

class User(Base):
    __tablename__ = "tb_users"
    user_no = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(20))
    user_nickname = Column(String(20), nullable=False, unique=True)
    user_email = Column(String(255), nullable=False)
    hashed_pw = Column(String(100), nullable=False)
    user_role = Column(String(20), default="member")
    user_regist_at = Column(TIMESTAMP, server_default=func.now())

    communities = relationship("Community", back_populates="owner")

class Community(Base):
    __tablename__ = "tb_community"
    community_no = Column(Integer, primary_key=True, index=True)
    community_title = Column(String(50), nullable=False)
    community_content = Column(Text, nullable=False)
    user_no = Column(Integer, ForeignKey("tb_users.user_no"), nullable=False)
    like_count = Column(Integer, default=0)
    community_created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="communities")

class CommunityLike(Base):
    __tablename__ = "tb_communitylike"
    like_id = Column(Integer, primary_key=True, index=True)
    community_no = Column(Integer, ForeignKey("tb_community.community_no"))
    user_no = Column(Integer, ForeignKey("tb_users.user_no"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CommunityComment(Base):
    __tablename__ = "tb_community_coment"

    coment_no = Column(Integer, primary_key=True, index=True)
    coment_content = Column(Text, nullable=False)
    coment_at = Column(DateTime, server_default=func.now(), nullable=False)
    community_no = Column(Integer, ForeignKey("tb_community.community_no", ondelete="CASCADE"), nullable=False)
    user_no = Column(Integer, ForeignKey("tb_users.user_no", ondelete="CASCADE"), nullable=False)

class Family(Base):
    __tablename__ = "tb_famliy"
    famliy_no = Column(Integer, primary_key=True, index=True)
    user_no = Column(Integer, ForeignKey("tb_users.user_no"), nullable=False)
    famliy_nickname = Column(String(20))
    famliy_created_at = Column(DateTime, server_default=func.now())
    
class FamilyMonthGoal(Base):
    __tablename__ = "tb_famliy_month_golas"
    
    month_golas_no = Column(Integer, primary_key=True, index=True)
    famliy_no = Column(Integer, ForeignKey("tb_famliy.famliy_no", ondelete="CASCADE"), nullable=False)
    month_golas_contents = Column(String(255), nullable=False)

class Schedule(Base):
    __tablename__ = "tb_schedule"
    schedule_no = Column(Integer, primary_key=True, index=True)
    famliy_no = Column(Integer, ForeignKey("tb_famliy.famliy_no"), nullable=False)
    schedule_cotents = Column(String(255))  # 일정 내용
    schedule_date = Column(TIMESTAMP, server_default=func.now())
    schedule_total_count = Column(Integer, nullable=False)  # 총 체크 가능한 횟수 추가

class ScheduleCheck(Base):
    __tablename__ = "tb_schedule_check"
    schedule_no = Column(Integer, ForeignKey("tb_schedule.schedule.no"), primary_key=True)
    schedule_check_count = Column(Integer, default=0)
    schedule_check_date = Column(DateTime, nullable=True)  # 마지막 체크 날짜 추가