from pydantic import BaseModel


class DisasterEvent(BaseModel):

    disaster_type: str
    location: str
    severity: int
    traffic_level: int
    victims: int