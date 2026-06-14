from pydantic import BaseModel
from typing import Optional, Any


class ServiceResponse(BaseModel):
    success: bool = True
    data: Optional[Any] = None
    error: Optional[str] = None
    service: str
    version: str = "1.0"


class HealthResponse(BaseModel):
    service: str
    status: str = "healthy"
    version: str = "1.0"
