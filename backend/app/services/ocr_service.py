import io
import json
import logging
import os
import re
from typing import Any

logger = logging.getLogger(__name__)


def _has_aws_creds() -> bool:
    return bool(os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"))


def _detect_doc_type(text: str, filename: str = "") -> str:
    lower_text = text.lower()
    lower_name = filename.lower()

    scores = {
        "Aadhaar": sum(1 for k in ["aadhaar", "uidai", "enrollment", "yogana"] if k in lower_text or k in lower_name),
        "PAN": sum(1 for k in ["pan card", "permanent account", "income tax", "pan"] if k in lower_text or k in lower_name),
        "Voter ID": sum(1 for k in ["voter", "epic", "election", "voter id"] if k in lower_text or k in lower_name),
        "Driving License": sum(1 for k in ["driving licence", "driving license", "motor vehicle", "transport"] if k in lower_text or k in lower_name),
        "Passport": sum(1 for k in ["passport", "ministry of external", "passport no"] if k in lower_text or k in lower_name),
        "Birth Certificate": sum(1 for k in ["birth certificate", "born on", "birth"] if k in lower_text or k in lower_name),
        "Marriage Certificate": sum(1 for k in ["marriage certificate", "married", "spouse"] if k in lower_text or k in lower_name),
        "Rental Agreement": sum(1 for k in ["rental agreement", "lease", "tenant", "lessor"] if k in lower_text or k in lower_name),
        "Bank Statement": sum(1 for k in ["bank statement", "account statement", "transaction"] if k in lower_text or k in lower_name),
        "Salary Slip": sum(1 for k in ["salary slip", "pay slip", "earnings", "deductions"] if k in lower_text or k in lower_name),
        "Property Document": sum(1 for k in ["sale deed", "property", "encumbrance", "patta"] if k in lower_text or k in lower_name),
        "Caste Certificate": sum(1 for k in ["caste", "community", "sc/st", "obc"] if k in lower_text or k in lower_name),
        "Income Certificate": sum(1 for k in ["income certificate", "annual income"] if k in lower_text or k in lower_name),
        "Marksheet": sum(1 for k in ["marksheet", "marks", "grade", "examination"] if k in lower_text or k in lower_name),
        "Medical Certificate": sum(1 for k in ["medical certificate", "health", "fitness"] if k in lower_text or k in lower_name),
    }

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Document"


_FIELD_EXTRACTORS: dict[str, list[tuple[str, str]]] = {
    "Aadhaar": [
        (r"(?i)(?:aadhaar|uid|enrollment)\s*(?:no|number|#)?\s*[:.\s]*([\dX\s]{8,16})", "aadhaar_number"),
        (r"(?i)name\s*[:.\s]*([A-Za-z\s]+?)(?:\d|\n)", "name"),
        (r"(?i)(?:DOB|date\s*of\s*birth|birth)\s*[:.\s]*(\d{2}[/-]\d{2}[/-]\d{4})", "dob"),
        (r"(?i)(?:address|addr)\s*[:.\s]*([A-Za-z0-9,\s/]+?)(?:\d{6}|\n)", "address"),
    ],
    "PAN": [
        (r"(?i)(?:pan|permanent account)\s*(?:no|number|#)?\s*[:.\s]*([A-Z]{5}\d{4}[A-Z])", "pan_number"),
        (r"(?i)name\s*[:.\s]*([A-Za-z\s]+?)(?:\n|\d)", "name"),
        (r"(?i)(?:father|father's|fathers)\s*name\s*[:.\s]*([A-Za-z\s]+?)(?:\n)", "father_name"),
    ],
    "Driving License": [
        (r"(?i)(?:dl|driving licence|driving license)\s*(?:no|number|#)?\s*[:.\s]*([A-Z0-9-]{8,20})", "dl_number"),
        (r"(?i)name\s*[:.\s]*([A-Za-z\s]+?)(?:\n|\d)", "name"),
        (r"(?i)(?:DOB|date of birth)\s*[:.\s]*(\d{2}[/-]\d{2}[/-]\d{4})", "dob"),
    ],
    "Passport": [
        (r"(?i)(?:passport|file)\s*(?:no|number|#)?\s*[:.\s]*([A-Z]\d{7})", "passport_number"),
        (r"(?i)surname\s*[:.\s]*([A-Za-z]+)", "surname"),
        (r"(?i)given name\s*[:.\s]*([A-Za-z\s]+)", "given_name"),
        (r"(?i)(?:DOB|date of birth)\s*[:.\s]*(\d{2}[/-]\d{2}[/-]\d{4})", "dob"),
    ],
    "Voter ID": [
        (r"(?i)(?:epic|voter)\s*(?:no|number|#)?\s*[:.\s]*([A-Z]{3}\d{7})", "epic_number"),
        (r"(?i)name\s*[:.\s]*([A-Za-z\s]+?)(?:\n|\d)", "name"),
        (r"(?i)(?:father|husband)\s*name\s*[:.\s]*([A-Za-z\s]+?)(?:\n)", "relative_name"),
    ],
}


def _extract_fields(text: str, doc_type: str) -> dict[str, Any]:
    fields: dict[str, Any] = {}
    extractors = _FIELD_EXTRACTORS.get(doc_type, [])
    for pattern, field_name in extractors:
        match = re.search(pattern, text)
        if match:
            fields[field_name] = match.group(1).strip()
    return fields


class OCRService:
    def __init__(self):
        self.use_textract = _has_aws_creds()
        if self.use_textract:
            try:
                import boto3
                self.textract = boto3.client("textract", region_name=os.getenv("AWS_REGION", "ap-south-1"))
                logger.info("AWS Textract initialized")
            except Exception as e:
                logger.warning(f"AWS Textract init failed: {e}, falling back to Tesseract")
                self.use_textract = False

    async def process_document(self, file_bytes: bytes, filename: str = "") -> dict[str, Any]:
        raw_text = ""
        confidence = "0%"

        if self.use_textract:
            result = await self._textract_ocr(file_bytes)
            raw_text = result["text"]
            confidence = result["confidence"]
        else:
            result = await self._tesseract_ocr(file_bytes)
            raw_text = result["text"]
            confidence = result["confidence"]

        doc_type = _detect_doc_type(raw_text, filename)
        extracted_fields = _extract_fields(raw_text, doc_type)

        return {
            "doc_type": doc_type,
            "raw_text": raw_text[:2000],
            "extracted_fields": extracted_fields,
            "confidence": confidence,
            "ocr_engine": "aws_textract" if self.use_textract else "tesseract",
        }

    async def _textract_ocr(self, file_bytes: bytes) -> dict[str, Any]:
        try:
            import boto3
            textract = boto3.client("textract", region_name=os.getenv("AWS_REGION", "ap-south-1"))
            response = textract.detect_document_text(Document={"Bytes": file_bytes})
        except Exception as e:
            logger.error(f"Textract error: {e}")
            return await self._tesseract_ocr(file_bytes)

        blocks = response.get("Blocks", [])
        lines = []
        confidence_scores = []
        for block in blocks:
            if block["BlockType"] == "LINE":
                lines.append(block["Text"])
                confidence_scores.append(block.get("Confidence", 0))

        text = "\n".join(lines)
        avg_confidence = f"{sum(confidence_scores) / len(confidence_scores):.0f}%" if confidence_scores else "0%"
        return {"text": text, "confidence": avg_confidence}

    async def _tesseract_ocr(self, file_bytes: bytes) -> dict[str, Any]:
        try:
            import pytesseract
            from PIL import Image
            image = Image.open(io.BytesIO(file_bytes))
            text = pytesseract.image_to_string(image)
            confidence = "75%"
        except Exception as e:
            logger.error(f"Tesseract error: {e}")
            text = "OCR engine unavailable."
            confidence = "0%"
        return {"text": text, "confidence": confidence}


ocr_service = OCRService()
