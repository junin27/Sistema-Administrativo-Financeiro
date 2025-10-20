"""
Router para APIs de contas a pagar - Etapa 2.
Implementa endpoints para validação e criação de contas a pagar.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config.database import get_db
from ..agent.payable_accounts import PayableAccountService
from ..schemas.payable_accounts import (
    PayableAccountCreateSchema,
    PayableAccountValidationResponseSchema,
    PayableAccountCreateResponseSchema
)
from ..core.exceptions import ValidationError, DatabaseError

router = APIRouter(prefix="/payable-accounts", tags=["Payable Accounts"])


def get_payable_account_service(db: Session = Depends(get_db)) -> PayableAccountService:
    """Dependency injection para PayableAccountService."""
    return PayableAccountService(db)


@router.post("/validate", response_model=PayableAccountValidationResponseSchema)
async def validate_payable_account_data(
    data: PayableAccountCreateSchema,
    service: PayableAccountService = Depends(get_payable_account_service)
):
    """
    Valida os dados de uma conta a pagar antes da criação.
    
    Verifica se Fornecedor, Faturado e Despesa existem no banco de dados
    e retorna o resultado das validações conforme especificação da Etapa 2.
    """
    try:
        validation_results = service.validate_payable_account_data(data)
        return validation_results
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )


@router.post("/", response_model=PayableAccountCreateResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_payable_account(
    data: PayableAccountCreateSchema,
    service: PayableAccountService = Depends(get_payable_account_service)
):
    """
    Cria uma nova conta a pagar - Etapa 2.
    
    Executa o fluxo completo:
    1. Valida Fornecedor, Faturado e Despesa
    2. Cria automaticamente os registros que não existem
    3. Cria o movimento principal em MovimentoContas
    4. Cria os relacionamentos com classificações
    5. Cria as parcelas associadas
    
    Retorna confirmação de sucesso conforme especificação.
    """
    try:
        result = service.create_payable_account(data)
        return result
        
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except DatabaseError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro interno do servidor: {str(e)}"
        )