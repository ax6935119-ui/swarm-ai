from fastapi import (
    APIRouter,
    HTTPException
)

from scenarios.disaster_scenarios import (
    get_all_scenarios
)

from services.scenario_service import (
    create_event_from_scenario
)

from orchestrator.langgraph_orchestrator import (
    graph
)

from websocket.disaster_socket import (
    set_simulation_data
)


router = APIRouter(
    prefix="/scenario",
    tags=["Scenario"]
)


@router.get("/")
async def list_scenarios():

    return {

        "scenarios":
            get_all_scenarios()
    }


@router.post("/{scenario_id}/start")
async def start_scenario(
    scenario_id: str
):

    try:

        disaster_event = (
            create_event_from_scenario(
                scenario_id
            )
        )

        print(
            "\n================================="
        )

        print(
            "🌍 REAL-WORLD SCENARIO STARTED"
        )

        print(
            f"Scenario: "
            f"{disaster_event['scenario_name']}"
        )

        print(
            f"Disaster: "
            f"{disaster_event['disaster']}"
        )

        print(
            f"Location: "
            f"{disaster_event['location']}"
        )

        print(
            f"Severity: "
            f"{disaster_event['severity']}/10"
        )

        print(
            "=================================\n"
        )

        result = graph.invoke({

            "event":
                disaster_event,

            "responses":
                []
        })

        set_simulation_data(
            result
        )

        return {

            "message":
                "Scenario simulation completed",

            "scenario":
                disaster_event,

            "data":
                result
        }

    except ValueError as e:

        raise HTTPException(

            status_code=404,

            detail=str(e)
        )

    except Exception as e:

        print(
            "❌ Scenario Error:",
            e
        )

        raise HTTPException(

            status_code=500,

            detail=str(e)
        )