"""
Routers para ParcelasContas.
Define endpoints REST para operações CRUD de parcelas.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from math import ceil
from datetime import date

from ..config.database import get_db
from ..repositories.parcelas_repository import ParcelasContasRepository
from ..schemas.parcelas_schemas import (
    ParcelasContasCreate, 
    ParcelasContasUpdate, 
    ParcelasContasResponse,
    ParcelasContasWithMovimento,
    ParcelaStatusUpdate,
)

# Router para Parcelas
parcelas_router = APIRouter(prefix="/parcelas", tags=["Parcelas de Contas"])


@parcelas_router.post("/", response_model=ParcelasContasResponse, status_code=status.HTTP_201_CREATED)
async def create_parcela(
    parcela: ParcelasContasCreate,
    db: Session = Depends(get_db)
):
    """Cria uma nova parcela."""
    repo = ParcelasContasRepository(db)
    
    # Verificar se identificacao já existe
    if parcela.identificacao:
        existing = repo.find_by_identificacao(parcela.identificacao)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Parcela com identificação '{parcela.identificacao}' já existe"
            )
    
    return repo.create(parcela.model_dump(exclude_unset=True))


@parcelas_router.get("/", response_model=List[ParcelasContasResponse])
async def list_parcelas(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(50, ge=1, le=100, description="Limite de registros"),
    status: Optional[str] = Query(None, description="Filtrar por status da parcela"),
    movimento_id: Optional[int] = Query(None, description="Filtrar por ID do movimento"),
    db: Session = Depends(get_db)
):
    """Lista todas as parcelas com paginação."""
    repo = ParcelasContasRepository(db)
    if status:
        return repo.find_by_status(status)[:limit]
    if movimento_id:
        return repo.find_by_movimento(movimento_id)[:limit]
    return repo.get_all(skip=skip, limit=limit)


@parcelas_router.get("/movimento/{movimento_id}", response_model=List[ParcelasContasResponse])
async def list_parcelas_by_movimento(
    movimento_id: int,
    db: Session = Depends(get_db)
):
    """Lista todas as parcelas de um movimento específico."""
    repo = ParcelasContasRepository(db)
    parcelas = repo.find_by_movimento(movimento_id)
    
    if not parcelas:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Nenhuma parcela encontrada para o movimento {movimento_id}"
        )
    
    return parcelas


@parcelas_router.get("/vencidas", response_model=List[ParcelasContasResponse])
async def list_parcelas_vencidas(
    data_referencia: Optional[date] = Query(None, description="Data de referência (padrão: hoje)"),
    db: Session = Depends(get_db)
):
    """Lista parcelas vencidas até uma data."""
    repo = ParcelasContasRepository(db)
    return repo.find_vencidas(data_referencia)


@parcelas_router.get("/a-vencer", response_model=List[ParcelasContasResponse])
async def list_parcelas_a_vencer(
    dias: int = Query(7, ge=1, le=90, description="Dias até vencimento"),
    db: Session = Depends(get_db)
):
    """Lista parcelas que vencem nos próximos N dias."""
    repo = ParcelasContasRepository(db)
    return repo.find_a_vencer(dias)


@parcelas_router.get("/{parcela_id}", response_model=ParcelasContasResponse)
async def get_parcela(
    parcela_id: int,
    db: Session = Depends(get_db)
):
    """Busca parcela por ID."""
    repo = ParcelasContasRepository(db)
    parcela = repo.get_by_id(parcela_id)
    
    if not parcela:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcela não encontrada"
        )
    
    return parcela


@parcelas_router.put("/{parcela_id}", response_model=ParcelasContasResponse)
async def update_parcela(
    parcela_id: int,
    parcela_update: ParcelasContasUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma parcela."""
    repo = ParcelasContasRepository(db)
    
    # Verificar se parcela existe
    existing = repo.get_by_id(parcela_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcela não encontrada"
        )
    
    updated = repo.update(parcela_id, parcela_update.model_dump(exclude_unset=True))
    return updated


@parcelas_router.patch("/{parcela_id}/status", response_model=ParcelasContasResponse)
async def update_parcela_status(
    parcela_id: int,
    payload: ParcelaStatusUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza status e, se aplicável, data de pagamento."""
    repo = ParcelasContasRepository(db)

    parcela = repo.update_status(parcela_id, payload.status, payload.datapagamento)

    if not parcela:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcela não encontrada"
        )

    return parcela


@parcelas_router.delete("/{parcela_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_parcela(
    parcela_id: int,
    db: Session = Depends(get_db)
):
    """Remove uma parcela."""
    repo = ParcelasContasRepository(db)
    
    if not repo.delete(parcela_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parcela não encontrada"
        )
