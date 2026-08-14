import json

from agents.emergency_agent import EmergencyAgent
from agents.traffic_agent import TrafficAgent
from agents.medical_agent import MedicalAgent
from agents.resource_agent import ResourceAgent

from orchestrator.main_orchestrator import SwarmOrchestrator


agents = [

    EmergencyAgent(),

    TrafficAgent(),

    MedicalAgent(),

    ResourceAgent()
]

orchestrator = SwarmOrchestrator(
    agents
)

# FIRST EVENT
event_1 = {

    "traffic_level": 82,

    "severity": 9,

    "victims": 40
}

result_1 = orchestrator.process_event(
    event_1
)

print("\n FIRST EVENT \n")

print(
    json.dumps(
        result_1,
        indent=4
    )
)

# SECOND EVENT
event_2 = {

    "traffic_level": 75,

    "severity": 9,

    "victims": 30
}

result_2 = orchestrator.process_event(
    event_2
)

print("\n SECOND EVENT \n")

print(
    json.dumps(
        result_2,
        indent=4
    )
)