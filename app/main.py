from fastapi import FastAPI
import asyncio
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from fastapi.middleware.cors import CORSMiddleware
from app.routers.act_camera import router as act_camera_router
from app.routers.gallery import router as gallery_router
from app.routers.community_like import router as community_like_router  
from app.routers.community import router as community_router
from app.routers.schedule import router as schedule_router
from app.routers.graph import router as graph_router
from app.routers.users import router as users_router

from app.routers.community_coment import router as community_coment_router
import os

async def lifespan(app: FastAPI):
    print("Starting application...")

    yield  # 애플리케이션 실행 중

    print("Shutting down application...")
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            print(f"Task {task} was cancelled.")
        except Exception as e:
            print(f"Error in task {task}: {e}")

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
app.include_router(act_camera_router)
app.include_router(gallery_router)
app.include_router(community_router)
app.include_router(community_like_router)
app.include_router(schedule_router)
app.include_router(graph_router)
app.include_router(community_coment_router)
app.include_router(users_router)

app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")


