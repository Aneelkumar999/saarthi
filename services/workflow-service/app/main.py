import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Saarthi AI — Workflow Engine Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"service": "workflow", "status": "healthy"}


@app.get("/")
async def root():
    return {"service": "workflow", "message": "Saarthi AI Workflow Engine Service"}
