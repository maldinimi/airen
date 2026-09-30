from sqlalchemy import Column, String, Boolean, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import JSONB
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(8), primary_key=True, index=True)  # Wajib 8 karakter
    name = Column(String(150), nullable=False)
    unit = Column(String(150), nullable=False)
    roles = Column(JSONB, nullable=False)                 # Array role: ["satker", "verifikator"]
    active_role = Column(String(50), nullable=False, default="satker")
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(String(50), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Standar Biaya Masukan (SBM)")
    description = Column(Text, nullable=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(255), nullable=False)
    file_size = Column(String(50), nullable=True)
    extracted_text = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    target_year = Column(String(10), default="2026")
    uploaded_by_id = Column(String(8), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(50), primary_key=True, index=True)

    ticket_number = Column(String(100), unique=True, nullable=False, index=True)
    satker_user_id = Column(String(8), ForeignKey("users.id"), nullable=False)
    program = Column(String(200), nullable=False)
    kegiatan = Column(String(200), nullable=False)
    kro = Column(String(150), nullable=False)
    ro = Column(String(150), nullable=False)
    unit_eselon1 = Column(String(150), nullable=False)
    unit_eselon2 = Column(String(150), nullable=False)
    prioritas = Column(String(50), nullable=False)
    rab_file_path = Column(String(255), nullable=False)
    rab_file_size = Column(String(50), nullable=True)
    regulation_id = Column(String(50), ForeignKey("regulations.id"), nullable=True)
    regulation_title = Column(String(255), nullable=True)
    ai_status = Column(String(20), nullable=False)         # LOLOS / TIDAK LOLOS
    ai_score = Column(Integer, nullable=False)
    ai_reason = Column(Text, nullable=True)
    ai_recommendation = Column(Text, nullable=True)
    ai_criteria_results = Column(JSONB, nullable=False)   # 20 kriteria baris per baris
    verification_status = Column(String(50), default="Menunggu") # Menunggu, Diterima, Ditolak
    verifikator_notes = Column(Text, nullable=True)
    verified_by_id = Column(String(8), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    digital_signature_hash = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())