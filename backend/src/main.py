"""
Aplicação principal FastAPI.
Configura routers, middleware e configurações globais.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging
import time

from .config.settings import settings
from .config.database import init_db, get_db
from .routers.ddl_routers import ddl_router
from .routers.pdf_router import router as pdf_router
from .routers.parcelas_routers import parcelas_router
from .routers.classificacao_routers import classificacao_router
from .core.constants import INTERNAL_SERVER_ERROR
from .core.exceptions import DuplicateInvoiceError

# Configurar logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Criar aplicação FastAPI
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Sistema administrativo financeiro com processamento de PDF via IA",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["*"],
)


# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Middleware para logging de todas as requests."""
    start_time = time.time()
    
    # Log da request
    logger.info(f"Request: {request.method} {request.url}")
    
    try:
        response = await call_next(request)
        
        # Log da response
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} | "
            f"Time: {process_time:.3f}s | "
            f"Path: {request.url.path}"
        )
        
        return response
    
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Error: {str(e)} | "
            f"Time: {process_time:.3f}s | "
            f"Path: {request.url.path}"
        )
        raise


# Exception handlers
@app.exception_handler(DuplicateInvoiceError)
async def duplicate_invoice_exception_handler(request: Request, exc: DuplicateInvoiceError):
    """Handler para erros de nota fiscal duplicada."""
    logger.warning(f"Duplicate invoice error: {exc.message} | Path: {request.url.path}")
    
    def serialize_data(data):
        """Converte objetos não serializáveis para JSON."""
        if isinstance(data, dict):
            return {k: serialize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [serialize_data(item) for item in data]
        elif hasattr(data, 'isoformat'):  # date, datetime objects
            return data.isoformat()
        elif hasattr(data, '__dict__'):  # Pydantic models or custom objects
            return serialize_data(data.__dict__)
        else:
            return data
    
    # Se há dados de verificação, incluir na resposta
    response_content = {
        "detail": exc.message,
        "error_code": exc.error_code,
        "invoice_number": exc.details.get("invoice_number")
    }
    
    # Incluir dados de verificação se disponíveis
    if "verification_data" in exc.details:
        response_content["verification_data"] = serialize_data(exc.details["verification_data"])
    
    # Incluir dados extraídos se disponíveis
    if "extracted_data" in exc.details:
        response_content["extracted_data"] = serialize_data(exc.details["extracted_data"])
    
    # Incluir ID do movimento existente se disponível
    if "existing_movement_id" in exc.details:
        response_content["existing_movement_id"] = exc.details["existing_movement_id"]
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content=response_content
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handler para erros de validação."""
    logger.warning(f"Validation error: {exc} | Path: {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": "Dados inválidos",
            "errors": exc.errors()
        }
    )


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(request: Request, exc: SQLAlchemyError):
    """Handler para erros de banco de dados."""
    logger.error(f"Database error: {exc} | Path: {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno do banco de dados"
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handler geral para exceções não tratadas."""
    logger.error(f"Unhandled error: {exc} | Path: {request.url.path}")
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "Erro interno do servidor"
        }
    )


# Events
@app.on_event("startup")
async def startup_event():
    """Evento executado na inicialização da aplicação."""
    logger.info("Iniciando aplicação...")
    
    try:
        # Inicializar banco de dados se estiver em modo debug
        if settings.debug:
            logger.info("Inicializando banco de dados...")
            init_db()
        
        logger.info("Aplicação iniciada com sucesso!")
    
    except Exception as e:
        logger.error(f"Erro na inicialização: {e}")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    """Evento executado no shutdown da aplicação."""
    logger.info("Finalizando aplicação...")


# Incluir routers
app.include_router(ddl_router)
app.include_router(pdf_router, prefix="/api/v1")
app.include_router(parcelas_router, prefix="/api/v1")
app.include_router(classificacao_router, prefix="/api/v1")
# Routers removidos - sistema agora usa apenas DDL
# app.include_router(suppliers.router, prefix="/api/v1")
# app.include_router(customers.router, prefix="/api/v1")
# app.include_router(revenue_types.router, prefix="/api/v1")
# app.include_router(expense_types.router, prefix="/api/v1")
# app.include_router(payable_accounts.router, prefix="/api/v1")


# Health check
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Endpoint de health check para verificar status da aplicação.
    Usado pelos health checks do Docker e monitoramento.
    """
    try:
        # Verificar conexão com banco de dados
        from .config.database import engine
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        
        return {
            "status": "healthy",
            "service": "Sistema Administrativo Financeiro",
            "version": settings.app_version,
            "environment": getattr(settings, 'environment', 'development'),
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "unhealthy",
                "service": "Sistema Administrativo Financeiro",
                "version": settings.app_version,
                "error": str(e),
                "database": "disconnected"
            }
        )


# Root endpoint
@app.get("/")
async def root():
    """Endpoint raiz com informações da API."""
    return {
        "message": "Sistema Administrativo Financeiro API",
        "version": settings.app_version,
        "docs": "/docs" if settings.debug else "Documentação disponível apenas em modo debug",
        "health": "/health"
    }
