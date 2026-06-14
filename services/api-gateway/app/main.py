import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

SERVICE_URLS = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://auth-service:8001"),
    "ai": os.getenv("AI_SERVICE_URL", "http://ai-service:8002"),
    "workflow": os.getenv("WORKFLOW_SERVICE_URL", "http://workflow-service:8003"),
    "profile": os.getenv("PROFILE_SERVICE_URL", "http://profile-service:8004"),
    "ocr": os.getenv("OCR_SERVICE_URL", "http://ocr-service:8005"),
}

app = FastAPI(title="Saarthi AI — API Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import httpx


async def proxy_request(service: str, path: str, method: str = "GET", body: dict | None = None, headers: dict | None = None):
    base = SERVICE_URLS.get(service)
    if not base:
        return JSONResponse(status_code=503, content={"error": f"Service '{service}' not available"})

    url = f"{base}{path}"
    req_headers = {k: v for k, v in (headers or {}).items() if k.lower() not in ("host", "content-length")}

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            if method == "GET":
                resp = await client.get(url, headers=req_headers)
            elif method == "POST":
                resp = await client.post(url, json=body, headers=req_headers)
            elif method == "PUT":
                resp = await client.put(url, json=body, headers=req_headers)
            elif method == "DELETE":
                resp = await client.delete(url, headers=req_headers)
            else:
                return JSONResponse(status_code=405, content={"error": f"Method {method} not supported"})
            return JSONResponse(status_code=resp.status_code, content=resp.json())
        except httpx.RequestError as e:
            return JSONResponse(status_code=502, content={"error": f"Service '{service}' unreachable: {e}"})


@app.get("/health")
async def health():
    return {"service": "api-gateway", "status": "healthy"}


@app.get("/")
async def root():
    return {
        "service": "api-gateway",
        "message": "Saarthi AI API Gateway",
        "endpoints": {
            "auth": "/api/v1/auth/* → Auth Service",
            "chat": "/api/v1/chat → AI Service",
            "workflow": "/api/v1/workflow/* → Workflow Service",
            "profile": "/api/v1/profile → Profile Service",
            "documents": "/api/v1/documents/* → OCR Service",
        },
    }


# ── Route mappings ─────────────────────────────────────────────

AUTH_PREFIX = "/api/v1/auth"
CHAT_PREFIX = "/api/v1/chat"
WORKFLOW_PREFIX = "/api/v1/workflow"
PROFILE_PREFIX = "/api/v1/profile"
DOCUMENTS_PREFIX = "/api/v1/documents"


@app.get(f"{AUTH_PREFIX}/{{path:path}}")
@app.post(f"{AUTH_PREFIX}/{{path:path}}")
@app.put(f"{AUTH_PREFIX}/{{path:path}}")
@app.delete(f"{AUTH_PREFIX}/{{path:path}}")
async def auth_proxy(path: str, method: str = None, body: dict = None):
    return await proxy_request("auth", f"/{path}", method, body)


@app.post(f"{CHAT_PREFIX}")
async def chat_proxy(body: dict = None):
    return await proxy_request("ai", "/chat", "POST", body)


@app.post(f"{CHAT_PREFIX}/{{path:path}}")
async def chat_proxy_path(path: str, body: dict = None):
    return await proxy_request("ai", f"/chat/{path}", "POST", body)


@app.get(f"{WORKFLOW_PREFIX}/{{path:path}}")
async def workflow_proxy(path: str):
    return await proxy_request("workflow", f"/workflow/{path}", "GET")


@app.get(f"{PROFILE_PREFIX}")
@app.put(f"{PROFILE_PREFIX}")
@app.get(f"{PROFILE_PREFIX}/{{path:path}}")
@app.put(f"{PROFILE_PREFIX}/{{path:path}}")
async def profile_proxy(path: str = "", method: str = None, body: dict = None):
    return await proxy_request("profile", f"/{path}", method, body)


@app.post(f"{DOCUMENTS_PREFIX}/{{path:path}}")
@app.get(f"{DOCUMENTS_PREFIX}/{{path:path}}")
async def documents_proxy(path: str, method: str = None, body: dict = None):
    return await proxy_request("ocr", f"/{path}", method, body)
