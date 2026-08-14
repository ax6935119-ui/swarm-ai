import asyncio
import random

from orchestrator.langgraph_orchestrator import (
    graph
)


async def generate_disaster_event():

    event = {

        "severity":
        random.randint(1, 10),

        "traffic_level":
        random.randint(20, 95),

        "victims":
        random.randint(5, 60),

        "zone":
        random.choice([

            "SectorA",

            "SectorB",

            "SectorC"
        ])
    }

    initial_state = {

        "event": event,

        "responses": []
    }

    result = graph.invoke(
        initial_state
    )

    return result


async def run_simulation():

    while True:

        result = await generate_disaster_event()

        print("\n🚨 NEW DISASTER EVENT\n")

        print(result)

        await asyncio.sleep(5)