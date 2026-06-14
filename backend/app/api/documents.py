from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.services.ocr_service import ocr_service
from app.services.rag_service import rag_service

router = APIRouter()

ALLOWED_TYPES = {".pdf", ".png", ".jpg", ".jpeg", ".tiff", ".tif", ".bmp"}


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ext = f".{file.filename.split('.')[-1].lower()}" if "." in (file.filename or "") else ""
    if ext not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported file type {ext}. Allowed: {', '.join(sorted(ALLOWED_TYPES))}")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    try:
        ocr_result = await ocr_service.process_document(content, file.filename or "")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {e}")

    doc = models.UserDocument(
        user_id=user.id,
        doc_type=ocr_result["doc_type"],
        filename=file.filename,
        raw_text=ocr_result["raw_text"],
        extracted_data=ocr_result["extracted_fields"],
        confidence=ocr_result["confidence"],
        status="processed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        await rag_service.index_document(doc.id, ocr_result["doc_type"], ocr_result["raw_text"], {
            "user_id": user.id,
            "filename": file.filename,
            "confidence": ocr_result["confidence"],
        })
    except Exception as e:
        logger = __import__("logging").getLogger(__name__)
        logger.warning(f"RAG indexing failed for doc {doc.id}: {e}")

    return {
        "id": doc.id,
        "doc_type": ocr_result["doc_type"],
        "confidence": ocr_result["confidence"],
        "extracted_fields": ocr_result["extracted_fields"],
        "ocr_engine": ocr_result["ocr_engine"],
        "message": "Document processed successfully",
    }
