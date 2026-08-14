from pprint import pprint

from orchestrator.langgraph_orchestrator import (
    graph
)


event = {

    "severity": 9,

    "traffic_level": 85,

    "victims": 42,

    "zone": "SectorB"
}


initial_state = {

    "event": event,

    "responses": []
}


result = graph.invoke(
    initial_state
)


print("\n==============================")
print("FINAL LANGGRAPH RESULT")
print("==============================\n")

pprint(result)