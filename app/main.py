from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.routers.act_camera import router as act_camera_router
from app.routers.gallery import router as gallery_router
from app.database import engine, Base
from app.routers.community_like import router as community_like  
from app.routers.community import router as community
from app.routers.schedule import router as schedule
from app.routers.graph import router as graph_router
from app.routers.community_coment import router as community_coment_router
import os

Base.metadata.create_all(bind=engine)

app = FastAPI(title="GrowFarm Community API")
app.router.redirect_slashes = False

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
app.include_router(community)
app.include_router(community_like)
app.include_router(schedule)
app.include_router(graph_router)
app.include_router(community_coment_router)
app.mount("/static", StaticFiles(directory=UPLOAD_DIR), name="static")


