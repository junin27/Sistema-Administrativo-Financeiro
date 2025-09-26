"""
Router para APIs de fornecedores.
Implementa endpoints RESTful com validações e tratamento de erros.
"""

from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..agent.people import SupplierService
from ..schemas.people import (
    SupplierCreateSchema, 
    SupplierUpdateSchema, 
    SupplierResponseSchema,
    SupplierFilterSchema
)
from ..schemas.base import PaginationSchema
from ..core.constants import (
    INTERNAL_SERVER_ERROR,
    SUPPLIER_NOT_FOUND,
    SUPPLIER_TAX_ID_EXISTS
)
from ..core.exceptions import (
    NotFoundError,
    DuplicateError,
    ValidationError
)

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])


def get_supplier_service(db: Session = Depends(get_db)) -> SupplierService:
    """Dependency injection para SupplierService."""
    return SupplierService(db)


@router.post("/", response_model=SupplierResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    supplier_data: SupplierCreateSchema,
    service: SupplierService = Depends(get_supplier_service)
):
    """Cria um novo fornecedor."""
    try:
        return service.create(supplier_data)
    except DuplicateError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.get("/", response_model=List[SupplierResponseSchema])
async def list_suppliers(
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(20, ge=1, le=100, description="Limite de registros por página"),
    company_name: Optional[str] = Query(None, description="Filtrar por razão social"),
    trade_name: Optional[str] = Query(None, description="Filtrar por nome fantasia"),
    tax_id: Optional[str] = Query(None, description="Filtrar por CNPJ"),
    active: Optional[bool] = Query(None, description="Filtrar por status ativo/inativo"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Lista todos os fornecedores com filtros opcionais."""
    try:
        filters = {}
        
        if company_name:
            filters["company_name"] = company_name
        if trade_name:
            filters["trade_name"] = trade_name
        if tax_id:
            filters["tax_id"] = tax_id
        if active is not None:
            filters["active"] = active
        
        return service.get_all(skip=skip, limit=limit, filters=filters or None)
    
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.get("/{supplier_id}", response_model=SupplierResponseSchema)
async def get_supplier(
    supplier_id: UUID,
    service: SupplierService = Depends(get_supplier_service)
):
    """Obtém um fornecedor específico por ID."""
    try:
        supplier = service.get_by_id(supplier_id)
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=SUPPLIER_NOT_FOUND
            )
        
        return supplier
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.put("/{supplier_id}", response_model=SupplierResponseSchema)
async def update_supplier(
    supplier_id: UUID,
    supplier_data: SupplierUpdateSchema,
    service: SupplierService = Depends(get_supplier_service)
):
    """Atualiza um fornecedor existente."""
    try:
        supplier = service.update(supplier_id, supplier_data)
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=SUPPLIER_NOT_FOUND
            )
        
        return supplier
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.delete("/{supplier_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_supplier(
    supplier_id: UUID,
    service: SupplierService = Depends(get_supplier_service)
):
    """Inativa um fornecedor (soft delete)."""
    try:
        success = service.soft_delete(supplier_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=SUPPLIER_NOT_FOUND
            )
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.patch("/{supplier_id}/reactivate", response_model=SupplierResponseSchema)
async def reactivate_supplier(
    supplier_id: UUID,
    service: SupplierService = Depends(get_supplier_service)
):
    """Reativa um fornecedor inativo."""
    try:
        success = service.reactivate(supplier_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=SUPPLIER_NOT_FOUND
            )
        
        # Retornar o fornecedor reativado
        return service.get_by_id(supplier_id)
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.get("/search/", response_model=List[SupplierResponseSchema])
async def search_suppliers(
    q: str = Query(..., min_length=1, description="Termo de busca"),
    skip: int = Query(0, ge=0, description="Número de registros a pular"),
    limit: int = Query(20, ge=1, le=100, description="Limite de registros por página"),
    service: SupplierService = Depends(get_supplier_service)
):
    """Busca fornecedores por nome (razão social ou fantasia)."""
    try:
        return service.search_by_name(q, skip, limit)
    
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )


@router.get("/tax-id/{tax_id}", response_model=SupplierResponseSchema)
async def get_supplier_by_tax_id(
    tax_id: str,
    service: SupplierService = Depends(get_supplier_service)
):
    """Obtém um fornecedor por CNPJ."""
    try:
        supplier = service.get_by_tax_id(tax_id)
        
        if not supplier:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=SUPPLIER_NOT_FOUND
            )
        
        return supplier
    
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=INTERNAL_SERVER_ERROR
        )
