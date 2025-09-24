"""
Exceções customizadas da aplicação.
Implementa hierarquia de exceções para melhor tratamento de erros.
"""

from typing import Optional, Dict, Any


class ApplicationError(Exception):
    """Classe base para exceções da aplicação."""
    
    def __init__(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class ValidationError(ApplicationError):
    """Exceção para erros de validação."""
    
    def __init__(
        self,
        message: str = "Erro de validação",
        field: Optional[str] = None,
        value: Optional[Any] = None,
        **kwargs
    ):
        details = kwargs.get('details', {})
        if field:
            details['field'] = field
        if value is not None:
            details['value'] = value
        
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            details=details
        )


class NotFoundError(ApplicationError):
    """Exceção para recursos não encontrados."""
    
    def __init__(
        self,
        resource_type: str,
        resource_id: Optional[str] = None,
        message: Optional[str] = None
    ):
        if not message:
            if resource_id:
                message = f"{resource_type} com ID {resource_id} não encontrado"
            else:
                message = f"{resource_type} não encontrado"
        
        details = {"resource_type": resource_type}
        if resource_id:
            details["resource_id"] = resource_id
        
        super().__init__(
            message=message,
            error_code="NOT_FOUND",
            details=details
        )


class DuplicateError(ApplicationError):
    """Exceção para recursos duplicados."""
    
    def __init__(
        self,
        resource_type: str,
        field: str,
        value: str,
        message: Optional[str] = None
    ):
        if not message:
            message = f"Já existe {resource_type} com {field}: {value}"
        
        super().__init__(
            message=message,
            error_code="DUPLICATE_RESOURCE",
            details={
                "resource_type": resource_type,
                "field": field,
                "value": value
            }
        )


class BusinessRuleError(ApplicationError):
    """Exceção para violações de regras de negócio."""
    
    def __init__(
        self,
        message: str,
        rule_code: Optional[str] = None,
        **kwargs
    ):
        super().__init__(
            message=message,
            error_code=rule_code or "BUSINESS_RULE_VIOLATION",
            details=kwargs.get('details', {})
        )


class ExternalServiceError(ApplicationError):
    """Exceção para erros em serviços externos."""
    
    def __init__(
        self,
        service_name: str,
        message: str = "Erro no serviço externo",
        status_code: Optional[int] = None,
        **kwargs
    ):
        details = {"service_name": service_name}
        if status_code:
            details["status_code"] = status_code
        
        super().__init__(
            message=f"{service_name}: {message}",
            error_code="EXTERNAL_SERVICE_ERROR",
            details=details
        )


class PDFProcessingError(ApplicationError):
    """Exceção específica para erros de processamento de PDF."""
    
    def __init__(
        self,
        message: str = "Erro ao processar PDF",
        stage: Optional[str] = None,
        **kwargs
    ):
        details = kwargs.get('details', {})
        if stage:
            details['processing_stage'] = stage
        
        super().__init__(
            message=message,
            error_code="PDF_PROCESSING_ERROR",
            details=details
        )


class FileUploadError(ApplicationError):
    """Exceção para erros de upload de arquivo."""
    
    def __init__(
        self,
        message: str = "Erro no upload do arquivo",
        file_type: Optional[str] = None,
        file_size: Optional[int] = None,
        **kwargs
    ):
        details = kwargs.get('details', {})
        if file_type:
            details['file_type'] = file_type
        if file_size:
            details['file_size'] = file_size
        
        super().__init__(
            message=message,
            error_code="FILE_UPLOAD_ERROR",
            details=details
        )


class DatabaseError(ApplicationError):
    """Exceção para erros de banco de dados."""
    
    def __init__(
        self,
        message: str = "Erro de banco de dados",
        operation: Optional[str] = None,
        **kwargs
    ):
        details = kwargs.get('details', {})
        if operation:
            details['operation'] = operation
        
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            details=details
        )


class AuthenticationError(ApplicationError):
    """Exceção para erros de autenticação."""
    
    def __init__(
        self,
        message: str = "Falha na autenticação",
        **kwargs
    ):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_ERROR",
            details=kwargs.get('details', {})
        )


class AuthorizationError(ApplicationError):
    """Exceção para erros de autorização."""
    
    def __init__(
        self,
        message: str = "Acesso negado",
        required_permission: Optional[str] = None,
        **kwargs
    ):
        details = kwargs.get('details', {})
        if required_permission:
            details['required_permission'] = required_permission
        
        super().__init__(
            message=message,
            error_code="AUTHORIZATION_ERROR",
            details=details
        )


class ConfigurationError(ApplicationError):
    """Exceção para erros de configuração."""
    
    def __init__(
        self,
        message: str = "Erro de configuração",
        config_key: Optional[str] = None,
        **kwargs
    ):
        details = kwargs.get('details', {})
        if config_key:
            details['config_key'] = config_key
        
        super().__init__(
            message=message,
            error_code="CONFIGURATION_ERROR",
            details=details
        )
