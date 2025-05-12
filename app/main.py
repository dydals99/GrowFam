from fastapi import FastAPI
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers.community.community_like import router as community_like_router  
from app.routers.community.community import router as community_router
from app.routers.community.community_coment import router as community_coment_router
from app.routers.schedule.schedule import router as schedule_router
from app.routers.schedule.graph import router as graph_router
from app.routers.users.users import router as users_router
from app.routers.users.family import router as family_router
from app.routers.measure.act_measure import router as act_measure
from app.routers.measure.measure import router as measure
import os

load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting application...")
    try:
        yield
    finally:
        print("Shutting down application...")

app = FastAPI(title="GrowFarm Community API", lifespan=lifespan)

Base.metadata.create_all(bind=engine)

UPLOAD_DIR = os.path.join(os.getcwd(), "uploaded_photos")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# 라우터 추가
app.include_router(act_measure)
app.include_router(measure)
app.include_router(community_router)
app.include_router(community_like_router)
app.include_router(schedule_router)
app.include_router(graph_router)
app.include_router(community_coment_router)
app.include_router(users_router)
app.include_router(family_router)

# 정적 파일 제공 설정
app.mount("/static", StaticFiles(directory="static"), name="static")


