from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models import models

router = APIRouter()

@router.get("/generate/{service_id}")
async def generate_form(service_id: int, db: Session = Depends(get_db)):
    # 1. Fetch service details
    service = db.query(models.Service).filter(models.Service.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
        
    # 2. Simulate data retrieval from OCR'd documents
    # In a real app, we would query UserDocument table
    user_data = {
        "full_name": "Anil Kumar",
        "dob": "2004-01-01",
        "address": "Hyderabad, Telangana",
        "id_verified": True
    }
    
    # 3. Map to form fields
    filled_form = {
        "form_name": f"Application for {service.name}",
        "department": service.department,
        "fields": [
            {"label": "Applicant Name", "value": user_data["full_name"]},
            {"label": "Date of Birth", "value": user_data["dob"]},
            {"label": "Residential Address", "value": user_data["address"]},
            {"label": "Service Fee", "value": f"₹{service.fee}"}
        ],
        "status": "Ready for submission"
    }
    
    return filled_form
