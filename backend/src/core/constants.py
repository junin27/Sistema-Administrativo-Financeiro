"""
Constantes da aplicação.
Centraliza mensagens, configurações e valores fixos para facilitar manutenção.
"""

# ==================== MENSAGENS DE ERRO ====================

# Mensagens gerais
INTERNAL_SERVER_ERROR = "Erro interno do servidor"
VALIDATION_ERROR = "Erro de validação"
NOT_FOUND_ERROR = "Recurso não encontrado"
UNAUTHORIZED_ERROR = "Acesso não autorizado"
FORBIDDEN_ERROR = "Acesso negado"

# Mensagens específicas de entidades
SUPPLIER_NOT_FOUND = "Fornecedor não encontrado"
SUPPLIER_TAX_ID_EXISTS = "Já existe um fornecedor cadastrado com este CNPJ"
SUPPLIER_CREATED_SUCCESS = "Fornecedor criado com sucesso"
SUPPLIER_UPDATED_SUCCESS = "Fornecedor atualizado com sucesso"
SUPPLIER_DELETED_SUCCESS = "Fornecedor inativado com sucesso"
SUPPLIER_REACTIVATED_SUCCESS = "Fornecedor reativado com sucesso"

CUSTOMER_NOT_FOUND = "Cliente não encontrado"
CUSTOMER_DOCUMENT_ID_EXISTS = "Já existe um cliente cadastrado com este CPF"
CUSTOMER_CREATED_SUCCESS = "Cliente criado com sucesso"
CUSTOMER_UPDATED_SUCCESS = "Cliente atualizado com sucesso"
CUSTOMER_DELETED_SUCCESS = "Cliente inativado com sucesso"
CUSTOMER_REACTIVATED_SUCCESS = "Cliente reativado com sucesso"

BILLED_PERSON_NOT_FOUND = "Pessoa faturada não encontrada"
BILLED_PERSON_DOCUMENT_ID_EXISTS = "Já existe uma pessoa faturada cadastrada com este CPF"

# Mensagens de validação
INVALID_TAX_ID_FORMAT = "CNPJ deve ter 14 dígitos"
INVALID_DOCUMENT_ID_FORMAT = "CPF deve ter 11 dígitos"
REQUIRED_FIELD_ERROR = "Campo obrigatório"
INVALID_EMAIL_FORMAT = "Formato de email inválido"
INVALID_PHONE_FORMAT = "Formato de telefone inválido"

# Mensagens de PDF
PDF_UPLOAD_SUCCESS = "PDF enviado e processado com sucesso"
PDF_PROCESSING_ERROR = "Erro ao processar PDF"
PDF_INVALID_FORMAT = "Formato de arquivo inválido. Apenas PDF é permitido"
PDF_TOO_LARGE = "Arquivo muito grande. Limite máximo: 10MB"
PDF_EXTRACTION_ERROR = "Erro ao extrair dados do PDF"

# ==================== CONFIGURAÇÕES DE VALIDAÇÃO ====================

# Tamanhos de campos
MAX_STRING_LENGTH = 255
MAX_TEXT_LENGTH = 1000
MAX_DESCRIPTION_LENGTH = 500

# Paginação
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
MIN_PAGE_SIZE = 1

# Upload de arquivos
MAX_FILE_SIZE_MB = 10
ALLOWED_FILE_TYPES = ["application/pdf"]

# Regex patterns
TAX_ID_PATTERN = r'^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$'
DOCUMENT_ID_PATTERN = r'^\d{3}\.\d{3}\.\d{3}\-\d{2}$'
EMAIL_PATTERN = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

# ==================== CATEGORIAS DE DESPESA ====================

EXPENSE_CATEGORIES = {
    "AGRICULTURAL_INPUTS": {
        "name": "INSUMOS AGRÍCOLAS",
        "description": "Sementes, fertilizantes, defensivos, corretivos",
        "keywords": [
            "semente", "fertilizante", "adubo", "defensivo", "herbicida", 
            "inseticida", "fungicida", "corretivo", "calcário", "uréia"
        ]
    },
    "MAINTENANCE_OPERATION": {
        "name": "MANUTENÇÃO E OPERAÇÃO",
        "description": "Combustíveis, peças, ferramentas, manutenção",
        "keywords": [
            "combustível", "diesel", "gasolina", "óleo", "peça", "ferramenta", 
            "manutenção", "reparo", "conserto", "filtro", "pneu"
        ]
    },
    "HUMAN_RESOURCES": {
        "name": "RECURSOS HUMANOS",
        "description": "Mão de obra, salários, encargos",
        "keywords": [
            "salário", "mão de obra", "funcionário", "trabalhador", "diarista", 
            "encargo", "inss", "fgts", "vale", "benefício"
        ]
    },
    "OPERATIONAL_SERVICES": {
        "name": "SERVIÇOS OPERACIONAIS",
        "description": "Frete, colheita, secagem, pulverização",
        "keywords": [
            "frete", "transporte", "colheita", "secagem", "pulverização", 
            "plantio", "aplicação", "serviço", "terceirizado"
        ]
    },
    "INFRASTRUCTURE_UTILITIES": {
        "name": "INFRAESTRUTURA E UTILIDADES",
        "description": "Energia, arrendamento, construções",
        "keywords": [
            "energia", "luz", "água", "arrendamento", "aluguel", "construção", 
            "obra", "material de construção", "cimento", "tijolo"
        ]
    },
    "ADMINISTRATIVE": {
        "name": "ADMINISTRATIVAS",
        "description": "Honorários, despesas bancárias",
        "keywords": [
            "honorário", "advocacia", "contabilidade", "consultoria", "banco", 
            "tarifa", "juros", "financiamento", "empréstimo"
        ]
    },
    "INSURANCE_PROTECTION": {
        "name": "SEGUROS E PROTEÇÃO",
        "description": "Seguro agrícola, de ativos, prestamista",
        "keywords": [
            "seguro", "proteção", "cobertura", "sinistro", "prêmio", 
            "seguradora", "prestamista", "rural"
        ]
    },
    "TAXES_FEES": {
        "name": "IMPOSTOS E TAXAS",
        "description": "ITR, IPTU, IPVA, INCRA-CCIR",
        "keywords": [
            "itr", "iptu", "ipva", "incra", "ccir", "imposto", "taxa", 
            "tributo", "municipal", "federal", "estadual"
        ]
    },
    "INVESTMENTS": {
        "name": "INVESTIMENTOS",
        "description": "Máquinas, veículos, imóveis, infraestrutura",
        "keywords": [
            "máquina", "trator", "implemento", "veículo", "caminhão", 
            "pickup", "equipamento", "benfeitorias", "infraestrutura"
        ]
    }
}

# ==================== STATUS ====================

# Status de contas
ACCOUNT_STATUS = {
    "PENDING": "Pendente",
    "PAID": "Pago",
    "OVERDUE": "Vencido",
    "CANCELLED": "Cancelado"
}

# Status de processamento
PROCESSING_STATUS = {
    "PENDING": "Pendente",
    "PROCESSING": "Processando",
    "COMPLETED": "Concluído",
    "FAILED": "Falhou"
}

# ==================== CONFIGURAÇÕES DE API ====================

# Timeouts
API_TIMEOUT_SECONDS = 30
AI_PROCESSING_TIMEOUT_SECONDS = 60

# Rate limiting
MAX_REQUESTS_PER_MINUTE = 60
MAX_UPLOAD_REQUESTS_PER_HOUR = 20

# CORS
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000"
]
