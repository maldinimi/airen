import os
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Regulation, Submission
from services.gemini_checker import analyze_rab_document

router = APIRouter()


@router.post("/api/submissions/upload-and-check")
async def submit_rab(
    program: str = Form(...),
    kegiatan: str = Form(...),
    kro: str = Form(...),
    ro: str = Form(...),
    unit_eselon1: str = Form(...),
    unit_eselon2: str = Form(...),
    prioritas: str = Form(...),
    satker_user_id: str = Form(...),
    rab_file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    pdf_bytes = await rab_file.read()
    active_regulation = db.query(Regulation).filter(Regulation.is_active == True).first()
    regulation_bytes = None

    if active_regulation and os.path.exists(active_regulation.file_path):
        try:
            with open(active_regulation.file_path, "rb") as source:
                regulation_bytes = source.read()
        except OSError:
            pass

    ai_result = analyze_rab_document(
        pdf_bytes=pdf_bytes,
        file_name=rab_file.filename,
        regulation_bytes=regulation_bytes,
        regulation_text=active_regulation.extracted_text if active_regulation else None,
        regulation_title=active_regulation.title if active_regulation else None,
    )
    extracted_text = ai_result.pop("extractedText", "")
    ticket_number = f"TIKET-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    submission = Submission(
        id=str(uuid.uuid4()),
        ticket_number=ticket_number,
        satker_user_id=satker_user_id,
        program=program,
        kegiatan=kegiatan,
        kro=kro,
        ro=ro,
        unit_eselon1=unit_eselon1,
        unit_eselon2=unit_eselon2,
        prioritas=prioritas,
        rab_file_path=f"uploads/{rab_file.filename}",
        rab_file_size=f"{round(len(pdf_bytes) / 1024, 1)} KB",
        regulation_id=active_regulation.id if active_regulation else None,
        regulation_title=(
            active_regulation.title
            if active_regulation
            else "PMK No. 49/PMK.02/2023 tentang Standar Biaya Masukan"
        ),
        ai_status=ai_result["aiStatus"],
        ai_score=ai_result["aiScore"],
        ai_reason=ai_result["aiReason"],
        ai_recommendation=ai_result["aiRecommendation"],
        ai_criteria_results=ai_result["criteriaResults"],
        verification_status="Menunggu",
    )
    db.add(submission)
    db.commit()
    db.refresh(submission)

    submission_data = {column.name: getattr(submission, column.name) for column in Submission.__table__.columns}
    submission_data["extractedText"] = extracted_text
    submission_data["activeRegulationTitle"] = submission.regulation_title
    return submission_data


@router.put("/api/submissions/{sub_id}/verify")
def verify_submission(sub_id: str, payload: dict, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == sub_id).first()
    if not submission:
        raise HTTPException(status_code=404, detail="Berkas tidak ditemukan")

    submission.ai_criteria_results = payload.get("criteriaResults", submission.ai_criteria_results)
    submission.verification_status = payload.get("verificationStatus")
    submission.verifikator_notes = payload.get("verifikatorNotes")
    submission.verified_by_id = payload.get("verifierId")
    submission.verified_at = datetime.now()
    submission.digital_signature_hash = f"DIGISIG-KOMDIGI-{uuid.uuid4().hex[:8].upper()}"
    db.commit()
    return {"status": "success", "message": "Keputusan verifikasi berhasil disimpan"}