"""
Router para RAG (Retrieval-Augmented Generation).
Fornece dois endpoints:
- POST /rag/simple: RAG simples com consultas a repositórios e resposta elaborada
- POST /rag/embeddings/query: RAG com índice de embeddings sobre documentos locais
"""

from typing import Dict
from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..agents.rag.rag_service import RAGService


class RAGQuestion(BaseModel):
    question: str = Field(..., min_length=3, description="Pergunta em linguagem natural")


rag_router = APIRouter(prefix="/rag", tags=["RAG (Consulta Inteligente)"])


@rag_router.post("/simple", status_code=status.HTTP_200_OK)
async def rag_simple(payload: RAGQuestion, db: Session = Depends(get_db)) -> Dict[str, object]:
    service = RAGService()
    result = await service.rag_simples(payload.question, db)
    return result


@rag_router.post("/embeddings/query", status_code=status.HTTP_200_OK)
async def rag_embeddings_query(payload: RAGQuestion) -> Dict[str, object]:
    service = RAGService()
    result = await service.rag_embeddings(payload.question)
    return result