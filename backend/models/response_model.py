# API response structure

from pydantic import BaseModel

class AnalysisResponse(BaseModel):
    summary: str
    risks: list[str]
    recommendations: list[str]
