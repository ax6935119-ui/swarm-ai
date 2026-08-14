from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard/data")
def dashboard_data():

    return {
    "disaster": "Flood",
    "severity": 8,
    "traffic": "High",
    "active_agents": 4,
    "victims": 40,
    "ambulances": 10
}