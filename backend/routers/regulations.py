import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Regulation
from services.gemini_checker import extract_pdf_text

router = APIRouter()


@router.get("/api/regulations")
def get_regulations(db: Session = Depends(get_db)):
    regulations = db.query(Regulation).order_by(Regulation.created_at.desc()).all()
    return [
        {
            "id": regulation.id,
            "title": regulation.title,
            "category": regulation.category,
            "description": regulation.description,
            "fileName": regulation.file_name,
            "fileSize": regulation.file_size,
            "isActive": regulation.is_active,
            "targetYear": regulation.target_year,
            "extractedRulesSummary": (
                regulation.extracted_text[:1200] + "..."
                if regulation.extracted_text and len(regulation.extracted_text) > 1200
                else (regulation.extracted_text or "")
            ),
            "createdAt": regulation.created_at.strftime("%Y-%m-%d %H:%M") if regulation.created_at else "",
        }
        for regulation in regulations
    ]


@router.post("/api/regulations/upload")
async def upload_regulation(
    title: str = Form(...),
    category: str = Form("Standar Biaya Masukan (SBM)"),
    target_year: str = Form("2026"),
    description: str = Form(""),
    uploaded_by_id: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    pdf_bytes = await file.read()
    file_path = f"uploads/regulations/{file.filename}"
    with open(file_path, "wb") as destination:
        destination.write(pdf_bytes)

    regulation = Regulation(
        id=f"REG-{uuid.uuid4().hex[:8].upper()}",
        title=title,
        category=category,
        target_year=target_year,
        description=description,
        file_name=file.filename,
        file_path=file_path,
        file_size=f"{round(len(pdf_bytes) / 1024, 1)} KB",
        extracted_text=extract_pdf_text(pdf_bytes),
        is_active=True,
        uploaded_by_id=uploaded_by_id or None,
    )
    db.add(regulation)
    db.commit()
    db.refresh(regulation)
    return {
        "id": regulation.id,
        "title": regulation.title,
        "category": regulation.category,
        "fileName": regulation.file_name,
        "fileSize": regulation.file_size,
        "isActive": regulation.is_active,
        "message": "Dokumen peraturan acuan berhasil diunggah dan diaktifkan untuk penilaian AI.",
    }


@router.put("/api/regulations/{reg_id}/toggle")
def toggle_regulation(reg_id: str, db: Session = Depends(get_db)):
    regulation = db.query(Regulation).filter(Regulation.id == reg_id).first()
    if not regulation:
        raise HTTPException(status_code=404, detail="Regulasi acuan tidak ditemukan")

    regulation.is_active = not regulation.is_active
    db.commit()
    return {"id": regulation.id, "isActive": regulation.is_active, "message": "Status acuan regulasi berhasil diubah"}


@router.delete("/api/regulations/{reg_id}")
def delete_regulation(reg_id: str, db: Session = Depends(get_db)):
    regulation = db.query(Regulation).filter(Regulation.id == reg_id).first()
    if not regulation:
        raise HTTPException(status_code=404, detail="Regulasi acuan tidak ditemukan")

    db.delete(regulation)
    db.commit()
    return {"status": "success", "message": "Dokumen regulasi berhasil dihapus"}