import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers.auth import router as auth_router
from routers.regulations import router as regulations_router
from routers.submissions import router as submissions_router

# Buat tabel otomatis jika belum ada di PostgreSQL
Base.metadata.create_all(bind=engine)
app = FastAPI(title="API Pengecekan Dokumen RAB AI", version="1.0.0")

# Pastikan direktori uploads tersedia
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/regulations", exist_ok=True)

# Konfigurasi CORS agar frontend React dapat mengakses API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(regulations_router)
app.include_router(submissions_router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "API Pengecekan Dokumen RAB AI"}