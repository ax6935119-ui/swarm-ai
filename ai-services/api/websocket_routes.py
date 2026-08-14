from fastapi import APIRouter
from fastapi import WebSocket

import asyncio

from orchestrator.main_orchestrator import (
    SwarmOrchestrator
)

from agents.emergency_agent import (
    EmergencyAgent
)

from agents.traffic_agent import (
    TrafficAgent
)

from agents.medical_agent import (
    MedicalAgent
)

from agents.resource_agent import (
    ResourceAgent
)

from shared.stream_manager import (
    StreamManager
)
from services.simulation_engine import (
    SimulationEngine
)
from services.vehicle_simulator import (
    VehicleSimulator
)
router = APIRouter()

stream_manager = StreamManager()

simulation_engine = SimulationEngine()
vehicle_simulator = VehicleSimulator()


@router.websocket("/ws/disaster")

async def disaster_socket(
    websocket: WebSocket
):

    await websocket.accept()

    agents = [

        EmergencyAgent(),

        TrafficAgent(),

        MedicalAgent(),

        ResourceAgent()
    ]

    orchestrator = SwarmOrchestrator(
        agents
    )

    while True:

        event = {
            simulation_engine.generate_event()
        }
        await websocket.send_json({

            "type": "new_disaster",

            "data": event
        })
        await stream_manager.send_log(

            websocket,

            "Emergency detected"
        )

        await asyncio.sleep(1)

        await stream_manager.send_log(

            websocket,

            "TrafficAgent optimizing route"
        )

        await asyncio.sleep(1)

        await stream_manager.send_log(

            websocket,

            "MedicalAgent prioritizing victims"
        )

        await asyncio.sleep(1)

        result = orchestrator.process_event(
            event
        )
        traffic_data = result[
        "agent_responses"
        ]["TrafficAgent"][
        "traffic_response"
        ]

        route_coordinates = traffic_data[
            "route_coordinates"
        ]

        await vehicle_simulator.simulate_vehicle_movement(

            websocket,

            route_coordinates
        )
        await websocket.send_json({

            "type": "final_result",

            "data": result
        })

        await asyncio.sleep(5)