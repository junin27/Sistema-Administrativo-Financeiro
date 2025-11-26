"""
Módulo de modelos do sistema.
Centraliza a importação de todos os modelos SQLAlchemy.
"""

# Importar modelos DDL seguindo o diagrama
from .ddl_models import Pessoas, MovimentoContas
from .parcelas_models import ParcelasContas
from .classificacao_models import Classificacao, movimento_contas_has_classificacao

__all__ = [
    # Modelos DDL principais
    "Pessoas",
    "MovimentoContas",
    "ParcelasContas",
    "Classificacao",
    "movimento_contas_has_classificacao",
]
