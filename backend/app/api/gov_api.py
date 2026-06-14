from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.services.gov_api_service import gov_api_service
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/gov", tags=["Government API Gateway"])


class SubmitApplicationRequest(BaseModel):
    portal_id: str
    service_name: str
    form_data: dict


class StatusCheckRequest(BaseModel):
    portal_id: str
    application_ref: str


class FetchDocumentRequest(BaseModel):
    portal_id: str
    doc_type: str


@router.get("/portals")
async def list_portals():
    return gov_api_service.get_portals()


@router.get("/portals/{portal_id}")
async def get_portal(portal_id: str):
    portals = gov_api_service.get_portals()
    for p in portals:
        if p["id"] == portal_id:
            return p
    raise HTTPException(status_code=404, detail=f"Portal '{portal_id}' not found")


@router.post("/submit")
async def submit_application(
    request: SubmitApplicationRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    portal = gov_api_service.get_portal_for_service(request.service_name)
    if not portal:
        portal = next((p for p in gov_api_service.get_portals() if p["id"] == request.portal_id), None)
    if not portal:
        raise HTTPException(status_code=404, detail=f"No portal found for service '{request.service_name}'")

    result = await gov_api_service.submit_application(
        db=db,
        user_id=user.id,
        portal_id=request.portal_id,
        service_name=request.service_name,
        form_data=request.form_data,
    )
    return result


@router.post("/status")
async def check_status(
    request: StatusCheckRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await gov_api_service.check_status(
        db=db, portal_id=request.portal_id, application_ref=request.application_ref
    )
    return result


@router.post("/fetch-document/{doc_type}")
async def fetch_document(
    doc_type: str,
    portal_id: str = Body("digilocker"),
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    result = await gov_api_service.fetch_document(
        db=db, user_id=user.id, portal_id=portal_id, doc_type=doc_type
    )
    return result


@router.get("/service/{service_name}/portal")
async def find_portal_for_service(service_name: str):
    portal = gov_api_service.get_portal_for_service(service_name)
    if not portal:
        raise HTTPException(status_code=404, detail=f"No portal found for service '{service_name}'")
    return portal
