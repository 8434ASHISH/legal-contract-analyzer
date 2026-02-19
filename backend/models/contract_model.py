# Data models for contracts

from pydantic import BaseModel

class Contract(BaseModel):
    title: str
    parties: list[str]
    content: str
