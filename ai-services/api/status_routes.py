from fastapi import APIRouter

router = APIRouter()

@router.get("/agents/status")
def get_status():
    return {
        "system": "active",
        "agents": [
            "EmergencyAgent",
            "TrafficAgent"
        ]
    }