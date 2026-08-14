import os

import requests

from fastapi import APIRouter

from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

ORS_API_KEY = os.getenv(
    "ORS_API_KEY"
)


@router.post("/route")
async def get_route(data: dict):

    coordinates = data.get(
        "coordinates",
        []
    )

    url = (
        "https://api.openrouteservice.org"
        "/v2/directions/driving-car/geojson"
    )

    headers = {

        "Authorization":
            ORS_API_KEY,

        "Content-Type":
            "application/json"
    }

    body = {

        "coordinates":
            coordinates
    }

    response = requests.post(
        url,
        json=body,
        headers=headers
    )

    return response.json()