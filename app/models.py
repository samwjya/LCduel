from pydantic import BaseModel

class JoinRequest(BaseModel):
    username: str