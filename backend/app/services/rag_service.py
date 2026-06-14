import os
import json
import hashlib
import logging
import uuid
from typing import Any

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    ScoredPoint,
)
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from app.models import models

logger = logging.getLogger(__name__)
load_dotenv()

EMBEDDING_DIM = 384


def _mock_embedding(text: str) -> list[float]:
    tokens = text.lower().split()[:64]
    vec = [0.0] * EMBEDDING_DIM
    for i, token in enumerate(tokens):
        h = int(hashlib.md5(token.encode()).hexdigest()[:8], 16)
        idx = i % EMBEDDING_DIM
        vec[idx] += (h % 100) / 100.0
    mag = sum(v * v for v in vec) ** 0.5
    if mag > 0:
        vec = [v / mag for v in vec]
    return vec


class RAGService:
    def __init__(self):
        self.client = QdrantClient(":memory:")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.collections_initialized = False

        if self.openai_api_key and self.openai_api_key != "your_openai_api_key_here":
            try:
                from openai import OpenAI
                self.openai = OpenAI(api_key=self.openai_api_key)
                self.use_openai = True
            except Exception:
                self.use_openai = False
        else:
            self.use_openai = False

    def _get_embedding(self, text: str) -> list[float]:
        if self.use_openai:
            try:
                resp = self.openai.embeddings.create(
                    model="text-embedding-3-small",
                    input=text[:8000],
                )
                return resp.data[0].embedding[:EMBEDDING_DIM]
            except Exception as e:
                logger.warning(f"OpenAI embedding failed: {e}, using mock")
        return _mock_embedding(text)

    def _ensure_collections(self):
        if self.collections_initialized:
            return
        collections = ["services", "schemes", "intents", "documents", "knowledge"]
        for name in collections:
            if not self.client.collection_exists(name):
                self.client.create_collection(
                    collection_name=name,
                    vectors_config=VectorParams(size=EMBEDDING_DIM, distance=Distance.COSINE),
                )
        self.collections_initialized = True

    def _point(self, collection: str, point_id: str, text: str, metadata: dict) -> PointStruct:
        embedding = self._get_embedding(text)
        return PointStruct(
            id=abs(hash(point_id)) % (2**63),
            vector=embedding,
            payload={"text": text, "metadata": metadata},
        )

    # ── Indexing ──────────────────────────────────────────────────────

    async def index_knowledge_base(self, db: Session) -> int:
        self._ensure_collections()
        total = 0

        services = db.query(models.Service).all()
        svc_points = []
        for s in services:
            text = f"{s.name}: {s.description or ''}. Department: {s.department}. Fee: Rs{s.fee or 0}. SLA: {s.sla_days or 0} days."
            svc_points.append(self._point("services", f"svc_{s.id}", text, {
                "id": s.id, "type": "service", "name": s.name, "department": s.department,
            }))
        if svc_points:
            self.client.upsert("services", points=svc_points)
            total += len(svc_points)

        schemes = db.query(models.Scheme).all()
        sch_points = []
        for s in schemes:
            rules = s.eligibility_rules or {}
            text = f"Scheme: {s.name}. Description: {s.description or ''}. Benefits: {rules.get('benefit', '')}. Category: {rules.get('category', 'general')}. Region: {rules.get('region', 'all')}."
            sch_points.append(self._point("schemes", f"sch_{s.id}", text, {
                "id": s.id, "type": "scheme", "name": s.name, "category": rules.get("category"),
            }))
        if sch_points:
            self.client.upsert("schemes", points=sch_points)
            total += len(sch_points)

        intents = db.query(models.Intent).all()
        int_points = []
        for i in intents:
            keywords = ", ".join(i.trigger_keywords or [])
            text = f"Intent: {i.name}. Description: {i.description or ''}. Keywords: {keywords}."
            int_points.append(self._point("intents", f"int_{i.id}", text, {
                "id": i.id, "type": "intent", "name": i.name,
            }))
        if int_points:
            self.client.upsert("intents", points=int_points)
            total += len(int_points)

        logger.info(f"Indexed {total} items into RAG collections")
        return total

    async def index_document(self, doc_id: int, doc_type: str, raw_text: str, metadata: dict | None = None) -> None:
        self._ensure_collections()
        text = f"Document type: {doc_type}. Content: {raw_text[:2000]}"
        point = self._point("documents", f"doc_{doc_id}", text, {
            "id": doc_id, "type": "document", "doc_type": doc_type, **(metadata or {}),
        })
        self.client.upsert("documents", points=[point])

    async def index_knowledge(self, key: str, text: str, metadata: dict | None = None) -> None:
        self._ensure_collections()
        point = self._point("knowledge", key, text, metadata or {"type": "knowledge"})
        self.client.upsert("knowledge", points=[point])

    # ── Retrieval ─────────────────────────────────────────────────────

    async def search(self, query: str, collection: str = "knowledge", limit: int = 5, threshold: float = 0.0) -> list[dict[str, Any]]:
        self._ensure_collections()
        if not self.client.collection_exists(collection):
            return []

        embedding = self._get_embedding(query)
        try:
            results = self.client.query_points(
                collection_name=collection,
                query=embedding,
                limit=limit,
                score_threshold=threshold,
            )
            scored = results.points if results else []
        except Exception as e:
            logger.warning(f"RAG search error: {e}")
            return []

        return [
            {
                "score": round(p.score, 3),
                "text": p.payload.get("text", ""),
                "metadata": p.payload.get("metadata", {}),
            }
            for p in scored
        ]

    async def search_all(self, query: str, limit: int = 3) -> list[dict[str, Any]]:
        results = []
        for collection in ["services", "schemes", "intents", "knowledge"]:
            items = await self.search(query, collection, limit=limit)
            results.extend(items)
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit * 2]

    async def format_context(self, query: str, max_items: int = 5) -> str:
        results = await self.search_all(query, limit=max_items)
        if not results:
            return ""

        sections = []
        for r in results:
            meta = r["metadata"]
            source = meta.get("name") or meta.get("doc_type") or meta.get("type", "unknown")
            sections.append(f"[{source}] (relevance: {r['score']})\n{r['text']}")

        return "Relevant context from knowledge base:\n\n" + "\n\n".join(sections[:max_items])

    def close(self):
        self.client.close()


rag_service = RAGService()
