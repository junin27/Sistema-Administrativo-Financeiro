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
from .routers import suppliers, pdf
from .core.constants import INTERNAL_SERVER_ERROR

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


# Routers
app.include_router(suppliers.router, prefix="/api/v1")
app.include_router(pdf.router, prefix="/api/v1")


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
