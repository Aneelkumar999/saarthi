import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Saarthi AI — OCR Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"service": "ocr", "status": "healthy"}


@app.get("/")
async def root():
    return {"service": "ocr", "message": "Saarthi AI OCR Service — AWS Textract + Tesseract"}
