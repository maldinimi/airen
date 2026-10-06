import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Regulation, Submission
from services.ai_checker import AIServiceError, analyze_document

router = APIRouter()


def _analyze_upload(
    uploaded_file: UploadFile,
    pdf_bytes: bytes,
    document_type: str,
    db: Session,
):
    active_regulation = db.query(Regulation).filter(Regulation.is_active == True).first()
    try:
        return analyze_document(
            pdf_bytes=pdf_bytes,
            file_name=uploaded_file.filename or f"dokumen-{document_type.lower()}.pdf",
            document_type=document_type,
            regulation_text=active_regulation.extracted_text if active_regulation else None,
            regulation_title=active_regulation.title if active_regulation else None,
        )
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.post("/api/submissions/check-rab")
async def check_rab(rab_file: UploadFile = File(...), db: Session = Depends(get_db)):
    return _analyze_upload(rab_file, await rab_file.read(), "RAB", db)


@router.post("/api/submissions/check-tor")
async def check_tor(tor_file: UploadFile = File(...), db: Session = Depends(get_db)):
    return _analyze_upload(tor_file, await tor_file.read(), "TOR", db)


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
    tor_file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
):
    pdf_bytes = await rab_file.read()
    active_regulation = db.query(Regulation).filter(Regulation.is_active == True).first()
    try:
        ai_result = analyze_document(
            pdf_bytes=pdf_bytes,
            file_name=rab_file.filename or "dokumen-rab.pdf",
            document_type="RAB",
            regulation_text=active_regulation.extracted_text if active_regulation else None,
            regulation_title=active_regulation.title if active_regulation else None,
        )
        tor_result = None
        if tor_file:
            tor_result = analyze_document(
                pdf_bytes=await tor_file.read(),
                file_name=tor_file.filename or "dokumen-tor.pdf",
                document_type="TOR",
                regulation_text=active_regulation.extracted_text if active_regulation else None,
                regulation_title=active_regulation.title if active_regulation else None,
                companion_text=ai_result["extractedText"],
                companion_file_name=rab_file.filename or "dokumen-rab.pdf",
            )
    except AIServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
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
    submission_data["torAnalysis"] = tor_result
    submission_data["torFileName"] = tor_file.filename if tor_file else None
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
    db.commit()
    return {"status": "success", "message": "Keputusan verifikasi berhasil disimpan"}