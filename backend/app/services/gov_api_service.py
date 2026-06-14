import json
import os
import hashlib
import hmac
import time
from datetime import datetime, timezone
from typing import Optional
from urllib.parse import urljoin

import httpx
from sqlalchemy.orm import Session

from app.models import models


GOV_PORTALS = {
    "meeseva": {
        "name": "MeeSeva",
        "base_url": "https://www.meeseva.telangana.gov.in",
        "description": "Telangana government services portal for certificates, licenses, and registrations",
        "auth_type": "api_key",
        "supported_services": [
            "Birth Certificate", "Caste Certificate", "Income Certificate",
            "Trade License", "Shop & Establishment", "Marriage Registration",
            "Property Registration", "Building Plan Approval",
        ],
    },
    "digilocker": {
        "name": "DigiLocker",
        "base_url": "https://api.digitallocker.gov.in",
        "description": "Digital document wallet for verified government-issued documents",
        "auth_type": "oauth2",
        "supported_services": [
            "Aadhaar", "PAN", "Voter ID", "Driving License",
            "Birth Certificate", "Mark Sheets", "Vehicle Registration",
        ],
    },
    "udyam": {
        "name": "Udyam Registration",
        "base_url": "https://udyamregistrations.gov.in",
        "description": "MSME registration portal for micro, small & medium enterprises",
        "auth_type": "api_key",
        "supported_services": ["MSME Registration"],
    },
    "fssai": {
        "name": "FSSAI",
        "base_url": "https://foscos.fssai.gov.in",
        "description": "Food Safety and Standards Authority of India — food license registration",
        "auth_type": "api_key",
        "supported_services": ["FSSAI Registration"],
    },
    "epfo": {
        "name": "EPFO",
        "base_url": "https://unifiedportal.epfindia.gov.in",
        "description": "Employees' Provident Fund Organisation",
        "auth_type": "api_key",
        "supported_services": ["PF Registration", "PF Claim"],
    },
    "esic": {
        "name": "ESIC",
        "base_url": "https://www.esic.gov.in",
        "description": "Employees' State Insurance Corporation",
        "auth_type": "api_key",
        "supported_services": ["ESIC Registration"],
    },
    "passport_seva": {
        "name": "Passport Seva",
        "base_url": "https://portal2.passportindia.gov.in",
        "description": "Ministry of External Affairs — passport application portal",
        "auth_type": "oauth2",
        "supported_services": ["Passport Application"],
    },
    "voter_portal": {
        "name": "National Voter Portal",
        "base_url": "https://voters.eci.gov.in",
        "description": "Election Commission of India — voter ID and form submission",
        "auth_type": "oauth2",
        "supported_services": ["Voter Form 8 Submission"],
    },
    "income_tax": {
        "name": "Income Tax e-Filing",
        "base_url": "https://www.incometax.gov.in",
        "description": "Income Tax Department — PAN application, ITR filing",
        "auth_type": "oauth2",
        "supported_services": ["PAN Application"],
    },
    "rti_online": {
        "name": "RTI Online",
        "base_url": "https://rtionline.gov.in",
        "description": "Right to Information portal for central government",
        "auth_type": "public",
        "supported_services": ["RTI Application"],
    },
}


class GovAPIService:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.api_keys = self._load_api_keys()

    def _load_api_keys(self):
        return {
            "meeseva": os.getenv("MEESEVA_API_KEY"),
            "digilocker": os.getenv("DIGILOCKER_CLIENT_ID"),
            "digilocker_secret": os.getenv("DIGILOCKER_CLIENT_SECRET"),
            "udyam": os.getenv("UDYAM_API_KEY"),
        }

    def get_portals(self) -> list[dict]:
        return [
            {
                "id": k,
                "name": v["name"],
                "base_url": v["base_url"],
                "description": v["description"],
                "auth_type": v["auth_type"],
                "supported_services": v["supported_services"],
                "status": "connected" if self.api_keys.get(k) else "not_configured",
            }
            for k, v in GOV_PORTALS.items()
        ]

    def get_portal_for_service(self, service_name: str) -> dict | None:
        name_lower = service_name.lower()
        name_words = set(name_lower.split())
        best_match = None
        best_score = 0
        for portal_id, portal in GOV_PORTALS.items():
            for supported in portal["supported_services"]:
                supported_lower = supported.lower()
                supported_words = set(supported_lower.split())
                common = name_words & supported_words
                score = len(common)
                if score > best_score:
                    best_score = score
                    best_match = {**portal, "id": portal_id}
        if best_score > 0:
            return best_match
        return None

    async def submit_application(
        self, db: Session, user_id: str, portal_id: str, service_name: str, form_data: dict
    ) -> dict:
        portal = GOV_PORTALS.get(portal_id)
        if not portal:
            return {"success": False, "error": f"Unknown portal: {portal_id}"}

        request_payload = self._build_request_payload(portal_id, service_name, form_data)
        application_ref = self._generate_application_ref(portal_id, user_id)

        audit_entry = models.AuditLog(
            user_id=user_id,
            action=f"gov_api_submit_{portal_id}",
            detail={
                "portal": portal_id,
                "service": service_name,
                "application_ref": application_ref,
                "payload": request_payload,
                "mode": "simulation",
            },
        )
        db.add(audit_entry)
        db.commit()

        response = await self._call_gov_api(portal_id, "submit", request_payload)

        return {
            "success": True,
            "portal": portal_id,
            "portal_name": portal["name"],
            "service": service_name,
            "application_ref": application_ref,
            "status": response.get("status", "submitted"),
            "message": f"Application submitted to {portal['name']} for {service_name}. Reference: {application_ref}",
            "tracking_url": f"{portal['base_url']}/track/{application_ref}",
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "is_simulation": True,
        }

    async def check_status(self, db: Session, portal_id: str, application_ref: str) -> dict:
        portal = GOV_PORTALS.get(portal_id)
        if not portal:
            return {"success": False, "error": f"Unknown portal: {portal_id}"}

        response = await self._call_gov_api(portal_id, "status", {"ref": application_ref})

        return {
            "success": True,
            "portal": portal_id,
            "portal_name": portal["name"],
            "application_ref": application_ref,
            "status": response.get("status", "under_process"),
            "stage": response.get("stage", "Document Verification"),
            "estimated_completion": response.get("estimated_completion", "15-20 days"),
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "is_simulation": True,
        }

    async def fetch_document(self, db: Session, user_id: str, portal_id: str, doc_type: str) -> dict:
        portal = GOV_PORTALS.get(portal_id)
        if not portal:
            return {"success": False, "error": f"Unknown portal: {portal_id}"}

        request_payload = {"doc_type": doc_type, "user_id": user_id}
        response = await self._call_gov_api(portal_id, "fetch_doc", request_payload)

        audit_entry = models.AuditLog(
            user_id=user_id,
            action=f"gov_api_fetch_doc_{portal_id}",
            detail={
                "portal": portal_id,
                "doc_type": doc_type,
                "mode": "simulation",
            },
        )
        db.add(audit_entry)
        db.commit()

        return {
            "success": True,
            "portal": portal_id,
            "portal_name": portal["name"],
            "doc_type": doc_type,
            "status": response.get("status", "available"),
            "data": response.get("data", {}),
            "message": response.get("message", f"Document '{doc_type}' retrieved from {portal['name']}"),
            "is_simulation": True,
        }

    async def _call_gov_api(self, portal_id: str, action: str, payload: dict) -> dict:
        return self._simulate_response(portal_id, action, payload)

    def _simulate_response(self, portal_id: str, action: str, payload: dict) -> dict:
        time.sleep(0.5)

        if action == "submit":
            return self._simulate_submit(portal_id, payload)
        elif action == "status":
            return self._simulate_status(portal_id, payload)
        elif action == "fetch_doc":
            return self._simulate_fetch_doc(portal_id, payload)
        return {"status": "unknown_action", "error": "Action not recognized"}

    def _simulate_submit(self, portal_id: str, payload: dict) -> dict:
        responses = {
            "meeseva": {
                "status": "submitted",
                "stage": "Document Scrutiny",
                "estimated_completion": "7-10 working days",
                "message": "Application received by MeeSeva. Reference number generated.",
            },
            "digilocker": {
                "status": "linked",
                "stage": "Verified",
                "estimated_completion": "Instant",
                "message": "Document fetched from DigiLocker successfully.",
            },
            "udyam": {
                "status": "submitted",
                "stage": "Auto-Verification",
                "estimated_completion": "2-3 working days",
                "message": "Udyam registration submitted. Acknowledgment sent via SMS.",
            },
            "fssai": {
                "status": "submitted",
                "stage": "State Authority Review",
                "estimated_completion": "30-45 days",
                "message": "FSSAI application forwarded to state authority for review.",
            },
        }
        return responses.get(portal_id, {
            "status": "submitted",
            "stage": "Pending Review",
            "estimated_completion": "15-30 days",
            "message": f"Application submitted to {portal_id}.",
        })

    def _simulate_status(self, portal_id: str, payload: dict) -> dict:
        days_passed = hash(payload.get("ref", "")) % 20
        if days_passed < 5:
            status = "under_process"
            stage = "Document Verification"
        elif days_passed < 12:
            status = "under_process"
            stage = "Department Review"
        else:
            status = "approved"
            stage = "Approved"

        return {
            "status": status,
            "stage": stage,
            "estimated_completion": "5-10 days",
        }

    def _simulate_fetch_doc(self, portal_id: str, payload: dict) -> dict:
        doc_type = payload.get("doc_type", "").lower()
        mock_data = {
            "aadhaar": {
                "document_name": "Aadhaar Card",
                "number": "XXXX-XXXX-1234",
                "name": "Citizen Name",
                "dob": "01/01/1990",
                "address": "Hyderabad, Telangana",
                "status": "valid",
            },
            "pan": {
                "document_name": "PAN Card",
                "number": "XXXXX1234X",
                "name": "Citizen Name",
                "status": "valid",
            },
            "voter id": {
                "document_name": "Voter ID",
                "number": "TS/XX/XXX/XXXXXX",
                "name": "Citizen Name",
                "address": "Hyderabad, Telangana",
                "status": "valid",
            },
            "driving license": {
                "document_name": "Driving License",
                "number": "TS-XX-2026-XXXXXX",
                "name": "Citizen Name",
                "status": "valid",
                "valid_until": "2031-06-01",
            },
            "birth certificate": {
                "document_name": "Birth Certificate",
                "number": "BC/2024/XXXXX",
                "name": "Citizen Name",
                "dob": "01/01/1990",
                "father_name": "Father Name",
                "status": "valid",
            },
        }
        data = mock_data.get(doc_type, {
            "document_name": doc_type.title(),
            "number": "REF-XXXXX",
            "status": "available",
        })

        return {
            "status": "available",
            "data": data,
            "message": f"{data['document_name']} retrieved from {GOV_PORTALS.get(portal_id, {}).get('name', portal_id)}.",
        }

    def _build_request_payload(self, portal_id: str, service_name: str, form_data: dict) -> dict:
        return {
            "portal": portal_id,
            "service": service_name,
            "form_data": form_data,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "Saarthi AI",
            "api_version": "v1",
        }

    def _generate_application_ref(self, portal_id: str, user_id: str) -> str:
        raw = f"{portal_id}-{user_id}-{int(time.time())}"
        short_hash = hashlib.md5(raw.encode()).hexdigest()[:8].upper()
        prefix = portal_id[:2].upper()
        return f"{prefix}/{short_hash}/{int(time.time()) % 10000:04d}"


gov_api_service = GovAPIService()
