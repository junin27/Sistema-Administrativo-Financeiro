"""
Routers para os modelos DDL (Pessoas e MovimentoContas).
Define endpoints REST para operações CRUD.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from math import ceil

from ..config.database import get_db
from ..repositories.ddl_repositories import PessoasRepository, MovimentoContasRepository
from ..repositories.parcelas_repository import ParcelasContasRepository
from ..models.ddl_models import MovimentoContas  # Adicionando import do modelo MovimentoContas
from ..core.exceptions import DuplicateInvoiceError
from ..schemas.ddl_schemas import (
    PessoasCreate, PessoasUpdate, PessoasResponse, PessoasListResponse, PessoasFilter,
    MovimentoContasCreate, MovimentoContasUpdate, MovimentoContasResponse, 
    MovimentoContasListResponse, MovimentoContasFilter, MovimentoContasResumo
)
from ..schemas.parcelas_schemas import ParcelasContasResponse, GerarParcelasRequest

# Router para Pessoas
pessoas_router = APIRouter(prefix="/pessoas", tags=["Pessoas"])

@pessoas_router.post("/", response_model=PessoasResponse, status_code=status.HTTP_201_CREATED)
async def create_pessoa(
    pessoa: PessoasCreate,
    db: Session = Depends(get_db)
):
    """Cria uma nova pessoa."""
    repo = PessoasRepository(db)
    
    # Verificar se documento já existe
    if pessoa.documento:
        existing = repo.find_by_documento(pessoa.documento)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pessoa com este documento já existe"
            )
    
    return repo.create(pessoa.model_dump(exclude_unset=True))


@pessoas_router.get("/", response_model=PessoasListResponse)
async def list_pessoas(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    documento: Optional[str] = Query(None, description="Filtrar por documento"),
    search: Optional[str] = Query(None, description="Buscar por nome"),
    order_by: Optional[str] = Query(None, description="Campo para ordenação"),
    order_dir: Optional[str] = Query(None, description="Direção da ordenação (asc/desc)"),
    db: Session = Depends(get_db)
):
    """Lista pessoas com paginação, filtros e ordenação."""
    repo = PessoasRepository(db)
    skip = (page - 1) * size
    
    # Aplicar filtros combinados
    if documento or search or tipo or status:
        items, total = repo.find_with_filters_paginated(
            skip=skip,
            limit=size,
            tipo=tipo,
            status=status,
            documento=documento,
            search=search,
            order_by=order_by,
            order_dir=order_dir
        )
    else:
        items = repo.get_all(skip=skip, limit=size, order_by=order_by, order_dir=order_dir)
        total = repo.count_all()
    
    # Converter models para schemas
    items_response = [PessoasResponse.model_validate(item) for item in items]
    
    return PessoasListResponse(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if total > 0 else 1
    )


@pessoas_router.get("/{pessoa_id}", response_model=PessoasResponse)
async def get_pessoa(
    pessoa_id: int,
    db: Session = Depends(get_db)
):
    """Busca pessoa por ID."""
    repo = PessoasRepository(db)
    pessoa = repo.get_by_id(pessoa_id)
    
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada"
        )
    
    return pessoa


@pessoas_router.put("/{pessoa_id}", response_model=PessoasResponse)
async def update_pessoa(
    pessoa_id: int,
    pessoa_update: PessoasUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza uma pessoa."""
    repo = PessoasRepository(db)
    
    # Verificar se pessoa existe
    existing = repo.get_by_id(pessoa_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada"
        )
    
    # Verificar documento duplicado
    if pessoa_update.documento and pessoa_update.documento != existing.documento:
        doc_exists = repo.find_by_documento(pessoa_update.documento)
        if doc_exists:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pessoa com este documento já existe"
            )
    
    updated = repo.update(pessoa_id, pessoa_update.model_dump(exclude_unset=True))
    return updated


@pessoas_router.delete("/{pessoa_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_pessoa(
    pessoa_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove uma pessoa FISICAMENTE.
    ATENÇÃO: Viola regra de negócio - use POST /inativar ao invés.
    """
    repo = PessoasRepository(db)
    
    if not repo.delete(pessoa_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada"
        )


@pessoas_router.post("/{pessoa_id}/inativar", response_model=PessoasResponse)
async def inativar_pessoa(
    pessoa_id: int,
    db: Session = Depends(get_db)
):
    """INATIVA uma pessoa (soft delete). Define deleted_at com timestamp atual."""
    repo = PessoasRepository(db)
    
    pessoa = repo.get_by_id(pessoa_id)
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada"
        )
    
    # Verificar se já está inativada
    if pessoa.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pessoa já está inativada"
        )
    
    inativada = repo.inactivate(pessoa_id)
    return inativada


@pessoas_router.post("/{pessoa_id}/reativar", response_model=PessoasResponse)
async def reativar_pessoa(
    pessoa_id: int,
    db: Session = Depends(get_db)
):
    """REATIVA uma pessoa inativada. Remove deleted_at."""
    repo = PessoasRepository(db)
    
    # Buscar incluindo inativadas
    pessoa = repo.get_by_id(pessoa_id, include_deleted=True)
    if not pessoa:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pessoa não encontrada"
        )
    
    # Verificar se está inativada
    if pessoa.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pessoa já está ativa"
        )
    
    reativada = repo.reactivate(pessoa_id)
    return reativada


@pessoas_router.get("/inativos", response_model=PessoasListResponse)
async def listar_pessoas_inativas(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página"),
    db: Session = Depends(get_db)
):
    """Lista apenas pessoas inativadas (soft deleted)."""
    repo = PessoasRepository(db)
    skip = (page - 1) * size
    
    items = repo.find_inactive()
    total = len(items)
    items = items[skip:skip + size]
    
    # Converter models para schemas
    items_response = [PessoasResponse.model_validate(item) for item in items]
    
    return PessoasListResponse(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if total > 0 else 1
    )


# Router para MovimentoContas
movimento_router = APIRouter(prefix="/movimentos", tags=["Movimento de Contas"])

@movimento_router.get("/resumo", response_model=List[MovimentoContasResumo])
async def get_resumo(
    db: Session = Depends(get_db)
):
    """Retorna resumo de movimentos agrupados por tipo."""
    repo = MovimentoContasRepository(db)
    
    # Buscar tipos únicos - corrigindo a consulta
    tipos = db.query(MovimentoContas.tipo).distinct().all()
    resumos = []
    
    for tipo_row in tipos:
        tipo = tipo_row[0]
        if tipo:
            movimentos = repo.find_by_tipo(tipo)
            total_valor = repo.get_total_by_tipo(tipo)
            
            resumos.append(MovimentoContasResumo(
                tipo=tipo,
                total_movimentos=len(movimentos),
                valor_total=total_valor
            ))
    
    return resumos


@movimento_router.get("/resumo/por-tipo", response_model=List[MovimentoContasResumo])
async def get_resumo_por_tipo(
    db: Session = Depends(get_db)
):
    """Retorna resumo de movimentos agrupados por tipo (rota alternativa)."""
    return await get_resumo(db)


@movimento_router.post("/", response_model=MovimentoContasResponse, status_code=status.HTTP_201_CREATED)
async def create_movimento(
    movimento: MovimentoContasCreate,
    db: Session = Depends(get_db)
):
    """Cria um novo movimento de contas."""
    repo = MovimentoContasRepository(db)
    pessoas_repo = PessoasRepository(db)
    
    # Verificar se as pessoas existem
    if not pessoas_repo.get_by_id(movimento.Pessoas_idFornecedorCliente):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fornecedor/Cliente não encontrado"
        )
    
    if not pessoas_repo.get_by_id(movimento.Pessoas_idfaturado):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Pessoa faturada não encontrada"
        )
    
    # Verificar nota fiscal duplicada
    if movimento.numeronotafiscal:
        existing = repo.find_by_nota_fiscal(movimento.numeronotafiscal)
        if existing:
            raise DuplicateInvoiceError(movimento.numeronotafiscal)
    
    return repo.create(movimento.model_dump(exclude_unset=True))


@movimento_router.get("/", response_model=MovimentoContasListResponse)
async def list_movimentos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página"),
    tipo: Optional[str] = Query(None, description="Filtrar por tipo"),
    status: Optional[str] = Query(None, description="Filtrar por status"),
    fornecedor_id: Optional[int] = Query(None, description="Filtrar por fornecedor"),
    numeronotafiscal: Optional[str] = Query(None, description="Filtrar por número da nota fiscal"),
    include_deleted: Optional[bool] = Query(False, description="Incluir registros deletados"),
    order_by: Optional[str] = Query(None, description="Campo para ordenação"),
    order_dir: Optional[str] = Query(None, description="Direção da ordenação (asc/desc)"),
    db: Session = Depends(get_db)
):
    """Lista movimentos com paginação, filtros e ordenação."""
    repo = MovimentoContasRepository(db)
    skip = (page - 1) * size
    
    # Aplicar filtros combinados
    if tipo or status or fornecedor_id or numeronotafiscal:
        items, total = repo.find_with_filters_paginated(
            skip=skip,
            limit=size,
            tipo=tipo,
            status=status,
            fornecedor_id=fornecedor_id,
            numeronotafiscal=numeronotafiscal,
            include_deleted=include_deleted,
            order_by=order_by,
            order_dir=order_dir
        )
    else:
        items = repo.get_all(skip=skip, limit=size, include_deleted=include_deleted, order_by=order_by, order_dir=order_dir)
        total = repo.count_all(include_deleted=include_deleted)
    
    # Converter models para schemas
    items_response = [MovimentoContasResponse.model_validate(item) for item in items]
    
    return MovimentoContasListResponse(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if total > 0 else 1
    )


@movimento_router.get("/{movimento_id}", response_model=MovimentoContasResponse)
async def get_movimento(
    movimento_id: int,
    db: Session = Depends(get_db)
):
    """Busca movimento por ID."""
    repo = MovimentoContasRepository(db)
    movimento = repo.get_by_id(movimento_id)
    
    if not movimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimento não encontrado"
        )
    
    return movimento


@movimento_router.put("/{movimento_id}", response_model=MovimentoContasResponse)
async def update_movimento(
    movimento_id: int,
    movimento_update: MovimentoContasUpdate,
    db: Session = Depends(get_db)
):
    """Atualiza um movimento."""
    repo = MovimentoContasRepository(db)
    pessoas_repo = PessoasRepository(db)
    
    # Verificar se movimento existe
    existing = repo.get_by_id(movimento_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimento não encontrado"
        )
    
    # Verificar pessoas se fornecidas
    if movimento_update.Pessoas_idFornecedorCliente:
        if not pessoas_repo.get_by_id(movimento_update.Pessoas_idFornecedorCliente):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fornecedor/Cliente não encontrado"
            )
    
    if movimento_update.Pessoas_idfaturado:
        if not pessoas_repo.get_by_id(movimento_update.Pessoas_idfaturado):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pessoa faturada não encontrada"
            )
    
    updated = repo.update(movimento_id, movimento_update.model_dump(exclude_unset=True))
    return updated


@movimento_router.delete("/{movimento_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_movimento(
    movimento_id: int,
    db: Session = Depends(get_db)
):
    """
    Remove um movimento FISICAMENTE.
    ATENÇÃO: Viola regra de negócio - use POST /inativar ao invés.
    """
    repo = MovimentoContasRepository(db)
    
    if not repo.delete(movimento_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimento não encontrado"
        )


@movimento_router.post("/{movimento_id}/inativar", response_model=MovimentoContasResponse)
async def inativar_movimento(
    movimento_id: int,
    db: Session = Depends(get_db)
):
    """INATIVA um movimento (soft delete). Define deleted_at com timestamp atual."""
    repo = MovimentoContasRepository(db)
    
    movimento = repo.get_by_id(movimento_id)
    if not movimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimento não encontrado"
        )
    
    # Verificar se já está inativado
    if movimento.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movimento já está inativado"
        )
    
    inativado = repo.inactivate(movimento_id)
    return inativado


@movimento_router.post("/{movimento_id}/reativar", response_model=MovimentoContasResponse)
async def reativar_movimento(
    movimento_id: int,
    db: Session = Depends(get_db)
):
    """REATIVA um movimento inativado. Remove deleted_at."""
    repo = MovimentoContasRepository(db)
    
    # Buscar incluindo inativados
    movimento = repo.get_by_id(movimento_id, include_deleted=True)
    if not movimento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Movimento não encontrado"
        )
    
    # Verificar se está inativado
    if movimento.deleted_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Movimento já está ativo"
        )
    
    reativado = repo.reactivate(movimento_id)
    return reativado


@movimento_router.post("/{movimento_id}/gerar-parcelas", response_model=List[ParcelasContasResponse])
async def gerar_parcelas_para_movimento(
    movimento_id: int,
    payload: GerarParcelasRequest,
    db: Session = Depends(get_db)
):
    """Gera parcelas automaticamente para um movimento existente.
    - Identificação: <numeronotafiscal>-PXX
    - Valor: dividido igualmente, ajustando o último pela diferença de arredondamento
    - Vencimentos: mensais, a partir de primeiro_vencimento ou data de emissão
    """
    mov_repo = MovimentoContasRepository(db)
    parc_repo = ParcelasContasRepository(db)

    movimento = mov_repo.get_by_id(movimento_id)
    if not movimento:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Movimento não encontrado")

    if not getattr(movimento, 'valortotal', None):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Movimento sem valor total para gerar parcelas")

    # Base de vencimento
    from datetime import date
    base_venc = payload.primeiro_vencimento or getattr(movimento, 'dataemissao', None) or date.today()

    # Função util para adicionar meses sem libs externas
    def add_months(d: date, months: int) -> date:
        m = d.month - 1 + months
        y = d.year + m // 12
        m = m % 12 + 1
        # Ajusta dia para evitar overflow (ex: 31 em fevereiro)
        from calendar import monthrange
        day = min(d.day, monthrange(y, m)[1])
        return date(y, m, day)

    # Particionar valor total
    from decimal import Decimal, ROUND_HALF_UP
    total = Decimal(str(movimento.valortotal))
    n = payload.numero_parcelas
    intervalo = payload.intervalo_meses or 1
    valor_base = (total / Decimal(n)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    # Verificar existentes para continuar numeração
    existentes = parc_repo.find_by_movimento(movimento_id)
    start_idx = 1
    if existentes:
        # Usa o maior numero_parcela existente + 1
        max_num = max([p.numero_parcela or 0 for p in existentes])
        start_idx = max_num + 1 if max_num > 0 else len(existentes) + 1

    parcelas_data = []
    acumulado = Decimal('0.00')
    for i in range(n):
        numero = start_idx + i
        venc = add_months(base_venc, i * intervalo)
        ident = f"{getattr(movimento, 'numeronotafiscal', 'MOV')}-P{numero:02d}"

        # Ajustar última parcela pelo restante
        if i < n - 1:
            valor = valor_base
            acumulado += valor
        else:
            valor = (total - acumulado).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        parcelas_data.append({
            "identificacao": ident,
            "numero_parcela": numero,
            "valorparcela": float(valor),
            "datavencimento": venc,
            "statusparcela": "PENDENTE",
            "MovimentoContas_idMovimentoContas": movimento_id,
        })

    criadas = parc_repo.create_many(parcelas_data)
    return criadas


@movimento_router.get("/inativos/list", response_model=MovimentoContasListResponse)
async def listar_movimentos_inativos(
    page: int = Query(1, ge=1, description="Número da página"),
    size: int = Query(50, ge=1, le=100, description="Tamanho da página"),
    db: Session = Depends(get_db)
):
    """Lista apenas movimentos inativados (soft deleted)."""
    repo = MovimentoContasRepository(db)
    skip = (page - 1) * size
    
    items = repo.find_inactive()
    total = len(items)
    items = items[skip:skip + size]
    
    # Converter models para schemas
    items_response = [MovimentoContasResponse.model_validate(item) for item in items]
    
    return MovimentoContasListResponse(
        items=items_response,
        total=total,
        page=page,
        size=size,
        pages=ceil(total / size) if total > 0 else 1
    )


# Router principal que combina todos
ddl_router = APIRouter(prefix="/api/v1")
ddl_router.include_router(pessoas_router)
ddl_router.include_router(movimento_router)
