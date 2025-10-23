"""
Módulo de schemas do sistema.
Centraliza a importação de todos os schemas Pydantic.
"""

from .ddl_schemas import (
    PessoasBase, PessoasCreate, PessoasUpdate, PessoasResponse,
    MovimentoContasBase, MovimentoContasCreate, MovimentoContasUpdate, MovimentoContasResponse,
    PessoasListResponse, MovimentoContasListResponse,
    PessoasFilter, MovimentoContasFilter, MovimentoContasResumo
)

__all__ = [
    "PessoasBase", "PessoasCreate", "PessoasUpdate", "PessoasResponse",
    "MovimentoContasBase", "MovimentoContasCreate", "MovimentoContasUpdate", "MovimentoContasResponse",
    "PessoasListResponse", "MovimentoContasListResponse",
    "PessoasFilter", "MovimentoContasFilter", "MovimentoContasResumo"
]
