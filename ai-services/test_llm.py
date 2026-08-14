from services.llm_service import generate_reasoning


event = {
    "type": "flood",
    "severity": 8
}


response = generate_reasoning(
    "TrafficAgent",
    "Use alternate emergency route",
    event
)

print(response)