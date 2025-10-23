"""
Schema base para todos os schemas Pydantic do projeto.
"""

from pydantic import BaseModel, ConfigDict


class BaseSchema(BaseModel):
    """Schema base para todos os schemas do projeto."""
    
    model_config = ConfigDict(
        from_attributes=True,
        validate_assignment=True,
        arbitrary_types_allowed=True,
        str_strip_whitespace=True
    )