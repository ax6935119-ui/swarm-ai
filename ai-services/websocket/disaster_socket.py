import asyncio

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect
)

router = APIRouter()

latest_simulation_data = None


def set_simulation_data(data):

    global latest_simulation_data

    latest_simulation_data = data


@router.websocket("/ws/disaster")
async def disaster_websocket(
    websocket: WebSocket
):

    await websocket.accept()

    print(
        "✅ WebSocket connected"
    )

    previous_data = None

    try:

        while True:

            global latest_simulation_data

            if (
                latest_simulation_data
                and
                latest_simulation_data != previous_data
            ):

                await websocket.send_json(
                    latest_simulation_data
                )

                print(
                    "📡 Simulation data sent"
                )

                previous_data = latest_simulation_data

            await asyncio.sleep(1)

    except WebSocketDisconnect:

        print(
            "❌ WebSocket disconnected"
        )