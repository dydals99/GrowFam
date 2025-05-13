from sqlalchemy import TIMESTAMP, Column, ForeignKey, Integer, String, DateTime, Text, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "tb_users"
    user_no = Column(Integer, primary_key=True, index=True)
    user_name = Column(String(20), nullable=True) 
    user_nickname = Column(String(20), nullable=False, unique=True)
    user_email = Column(String(255), nullable=False)
    user_password = Column(String(100), nullable=False)
    user_role = Column(String(20), default="member")
    user_regist_at = Column(TIMESTAMP, server_default=func.now())
    user_profile = Column(String, nullable=True)

    communities = relationship("Community", back_populates="owner")

class Community(Base):
    __tablename__ = "tb_community"
    community_no = Column(Integer, primary_key=True, index=True)
    community_title = Column(String(50), nullable=False)
    community_content = Column(Text, nullable=False)
    user_no = Column(Integer, ForeignKey("tb_users.user_no"), nullable=False)
    like_count = Column(Integer, default=0)
    community_regist_at = Column(DateTime(timezone=True), server_default=func.now())
    owner = relationship("User", back_populates="communities")

class CommunityLike(Base):
    __tablename__ = "tb_communitylike"
    like_id = Column(Integer, primary_key=True, index=True)
    community_no = Column(Integer, ForeignKey("tb_community.community_no"))
    user_no = Column(Integer, ForeignKey("tb_users.user_no"))
    like_regist_at = Column(DateTime(timezone=True), server_default=func.now())

class CommunityComent(Base):
    __tablename__ = "tb_community_coment"

    coment_no = Column(Integer, primary_key=True, index=True)
    coment_content = Column(Text, nullable=False)
    coment_regist_at = Column(DateTime, server_default=func.now(), nullable=False)
    community_no = Column(Integer, ForeignKey("tb_community.community_no", ondelete="CASCADE"), nullable=False)
    user_no = Column(Integer, ForeignKey("tb_users.user_no", ondelete="CASCADE"), nullable=False)

class Family(Base):
    __tablename__ = "tb_family"

    family_no = Column(Integer, primary_key=True, index=True)
    user_no = Column(Integer, ForeignKey("tb_users.user_no", ondelete="CASCADE"), nullable=False)
    family_nickname = Column(String(20), nullable=True)
    family_regist_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    goals = relationship("FamilyMonthGoals", back_populates="family")
    kids = relationship("KidInfo", back_populates="family")


class FamilyMonthGoals(Base):
    __tablename__ = "tb_famliy_month_golas"

    month_golas_no = Column(Integer, primary_key=True, index=True)
    family_no = Column(Integer, ForeignKey("tb_family.family_no", ondelete="CASCADE"), nullable=False)
    month_golas_contents = Column(String(255), nullable=True)

    # Relationship
    family = relationship("Family", back_populates="goals")


class KidInfo(Base):
    __tablename__ = "tb_kid_info"

    kid_info_no = Column(Integer, primary_key=True, index=True)
    family_no = Column(Integer, ForeignKey("tb_family.family_no", ondelete="CASCADE"), nullable=False)
    kid_height = Column(String(20), nullable=False)
    kid_weight = Column(String(20), nullable=False)
    kid_gender = Column(String(1), nullable=False)
    kid_birthday = Column(String(30), nullable=False)
    kid_info_regist_at = Column(TIMESTAMP, server_default=func.now())

    # Relationship
    family = relationship("Family", back_populates="kids")

class Measure(Base):
    __tablename__ = "tb_measure"

    measure_no = Column(Integer, primary_key=True, index=True)
    family_no = Column(Integer, ForeignKey("tb_family.family_no", ondelete="CASCADE"), nullable=False)
    measure_height = Column(String(100))
    measure_regist_at = Column(TIMESTAMP, server_default=func.now())

class Schedule(Base):
    __tablename__ = "tb_schedule"
    schedule_no = Column(Integer, primary_key=True, index=True)
    family_no = Column(Integer, ForeignKey("tb_family.family_no"), nullable=False)
    schedule_cotents = Column(String(255))  # 일정 내용
    schedule_date = Column(TIMESTAMP, server_default=func.now())
    schedule_total_count = Column(Integer, nullable=False)  # 총 체크 가능한 횟수 추가

class ScheduleCheck(Base):
    __tablename__ = "tb_schedule_check"
    schedule_no = Column(Integer, ForeignKey("tb_schedule.schedule_no"), primary_key=True)
    schedule_check_count = Column(Integer, default=0)
    schedule_check_date = Column(DateTime, nullable=True)  # 마지막 체크 날짜 추가

class ScheduleCheckLog(Base):
    __tablename__ = "tb_schedule_check_log"
    schedule_check_date_log_no = Column(Integer, primary_key=True, index=True)
    family_no = Column(Integer, ForeignKey("tb_family.family_no"), nullable=False)
    schedule_check_date_log = Column(DateTime, nullable=False) 