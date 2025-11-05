"""
Routers para Classificacao (Tipos de Receita e Despesa).
Define endpoints REST com suporte a soft delete (inativar/reativar).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from math import ceil

from ..config.database import get_db
from ..repositories.classificacao_repository import ClassificacaoRepository
from ..schemas.classificacao_schemas import (
    ClassificacaoCreate,
    ClassificacaoUpdate,
    ClassificacaoResponse,
    ClassificacaoListResponse,
    ClassificacaoFilter,
    TipoClassificacao
)

# Router para Classificacao
classificacao_router = APIRouter(prefix="/classificacoes", tags=["Classificações (Receita/Despesa)"])


@classificacao_router.post("/", response_model=ClassificacaoResponse, status_code=status.HTTP_201_CREATED)
async def create_classificacao(
    classificacao: ClassificacaoCreate,
    db: Session = Depends(get_db)
):
    """
    Cria uma nova classificação.
    REGRA: Cadastros não podem ser excluídos, apenas inativados.
    """
    repo = ClassificacaoRepository(db)
    
    # Verificar se já existe classificação com mesmo tipo e descrição
    existing = repo.find_by_tipo_and_descricao(
        classificacao.tipo.value, 
        classificacao.descricao
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Classificação '{classificacao.descricao}' do tipo '{classificacao.tipo}' já existe"
        )
    
    return repo.create(classificacao.model_dump(exclude_unset=True))


@classificacao_router.get("/", response_model=ClassificacaoListResponse)
async def list_classificacoes(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página"),
    tipo: Optional[TipoClassificacao] = Query(None, description="Filtrar por tipo"),
    include_deleted: bool = Query(False, description="Incluir registros inativados"),
    db: Session = Depends(get_db)
):
    """
    Lista classificações com paginação.
    Por padrão, ignora registros inativados (soft delete).
    """
    repo = ClassificacaoRepository(db)
    skip = (page - 1) * size
    
    # Aplicar filtros
    if tipo:
        items = repo.find_by_tipo(tipo.value, include_deleted=include_deleted)
        total = len(items)
        items = items[skip:skip + size]
    else:
        items = repo.get_all(skip=skip, limit=size, include_deleted=include_deleted)
        total = len(repo.get_all(include_deleted=include_deleted))
    
    # Converter models para schemas
    items_response = [ClassificacaoResponse.model_validate(item) for item in items]
    
    return ClassificacaoListResponse(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if total > 0 else 1
    )


@classificacao_router.get("/tipo/{tipo}", response_model=List[ClassificacaoResponse])
async def list_classificacoes_by_tipo(
    tipo: TipoClassificacao,
    include_deleted: bool = Query(False, description="Incluir registros inativados"),
    db: Session = Depends(get_db)
):
    """Lista classificações por tipo (RECEITA ou DESPESA)."""
    repo = ClassificacaoRepository(db)
    return repo.find_by_tipo(tipo.value, include_deleted=include_deleted)


@classificacao_router.get("/ativas", response_model=List[ClassificacaoResponse])
async def list_classificacoes_ativas(
    db: Session = Depends(get_db)
):
    """Lista apenas classificações ativas (não inativadas)."""
    repo = ClassificacaoRepository(db)
    return repo.find_active()


@classificacao_router.get("/inativas", response_model=List[ClassificacaoResponse])
async def list_classificacoes_inativas(
    db: Session = Depends(get_db)
):
    """Lista classificações inativadas (soft deleted)."""
    repo = ClassificacaoRepository(db)
    return repo.find_inactive()


@classificacao_router.get("/{classificacao_id}", response_model=ClassificacaoResponse)
async def get_classificacao(
    classificacao_id: int,
    include_deleted: bool = Query(False, description="Incluir se estiver inativado"),
    db: Session = Depends(get_db)
):
    """Busca classificação por ID."""
    repo = ClassificacaoRepository(db)
    classificacao = repo.get_by_id(classificacao_id, include_deleted=include_deleted)
    
    if not classificacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classificação não encontrada"
        )
    
    return classificacao


@classificacao_router.put("/{classificacao_id}", response_model=ClassificacaoResponse)
async def update_classificacao(
    classificacao_id: int,
    classificacao_update: ClassificacaoUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma classificação."""
    repo = ClassificacaoRepository(db)
    
    # Verificar se classificação existe
    existing = repo.get_by_id(classificacao_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classificação não encontrada"
        )
    
    updated = repo.update(classificacao_id, classificacao_update.model_dump(exclude_unset=True))
    return updated


@classificacao_router.post("/{classificacao_id}/inativar", response_model=ClassificacaoResponse)
async def inativar_classificacao(
    classificacao_id: int,
    db: Session = Depends(get_db)
):
    """
    INATIVA uma classificação (soft delete).
    REGRA: Cadastros não podem ser excluídos, apenas INATIVADOS.
    """
    repo = ClassificacaoRepository(db)
    
    classificacao = repo.inactivate(classificacao_id)
    
    if not classificacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classificação não encontrada ou já está inativa"
        )
    
    return classificacao


@classificacao_router.post("/{classificacao_id}/reativar", response_model=ClassificacaoResponse)
async def reativar_classificacao(
    classificacao_id: int,
    db: Session = Depends(get_db)
):
    """
    REATIVA uma classificação inativada.
    Remove soft delete e define status como ativo.
    """
    repo = ClassificacaoRepository(db)
    
    classificacao = repo.reactivate(classificacao_id)
    
    if not classificacao:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classificação não encontrada ou já está ativa"
        )
    
    return classificacao
