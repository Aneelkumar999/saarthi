from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.models import models
from app.services.rag_service import rag_service
from pydantic import BaseModel

router = APIRouter(prefix="/rag", tags=["RAG Pipeline"])


class SearchRequest(BaseModel):
    query: str
    collection: str = "knowledge"
    limit: int = 5


class IndexDocumentRequest(BaseModel):
    doc_type: str
    raw_text: str


@router.post("/search")
async def search(request: SearchRequest):
    results = await rag_service.search(request.query, request.collection, request.limit)
    return {"query": request.query, "results": results}


@router.post("/search/all")
async def search_all(query: str, limit: int = 5):
    results = await rag_service.search_all(query, limit)
    return {"query": query, "results": results}


@router.get("/context")
async def get_context(query: str):
    context = await rag_service.format_context(query)
    return {"query": query, "context": context}


@router.post("/index/knowledge-base")
async def index_knowledge_base(db: Session = Depends(get_db)):
    count = await rag_service.index_knowledge_base(db)
    return {"indexed": count, "message": f"Knowledge base indexed ({count} items)"}


@router.post("/index/document")
async def index_document(
    request: IndexDocumentRequest,
    user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    doc = models.UserDocument(
        user_id=user.id,
        doc_type=request.doc_type,
        raw_text=request.raw_text,
        status="indexed",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    await rag_service.index_document(doc.id, request.doc_type, request.raw_text, {"user_id": user.id})
    return {"id": doc.id, "message": "Document indexed into RAG"}


@router.get("/stats")
async def get_rag_stats():
    rag_service._ensure_collections()
    stats = {}
    for name in ["services", "schemes", "intents", "documents", "knowledge"]:
        if rag_service.client.collection_exists(name):
            info = rag_service.client.get_collection(name)
            stats[name] = info.points_count
        else:
            stats[name] = 0
    return {
        "collection_stats": stats,
        "embedding_provider": "openai" if rag_service.use_openai else "mock",
    }
