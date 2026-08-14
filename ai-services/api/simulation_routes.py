import random
import uuid

from fastapi import APIRouter

from orchestrator.langgraph_orchestrator import graph

from websocket.disaster_socket import (
    set_simulation_data
)

router = APIRouter()


@router.post("/simulation/start")
async def start_simulation():

    try:

        # =====================================================
        # GENERATE SIMULATION EVENT
        # =====================================================

        disaster_event = {

            "event_id":
                str(uuid.uuid4()),

            "disaster":
                "Flood",

            "disaster_type":
                "Flood",

            "location":
                "Pune, Maharashtra",

            "severity":
                random.randint(5, 10),

            "victims":
                random.randint(10, 50),

            "victim_estimate":
                random.randint(10, 50),

            "traffic_level":
                random.randint(40, 95),

            "traffic_impact":
                "high",

            "medical_access_impact":
                random.choice([
                    "low",
                    "medium",
                    "high"
                ]),

            "evacuation_required":
                True,

            "latitude":
                18.5204,

            "longitude":
                73.8567
        }

        print("\n" + "=" * 60)
        print("🧪 STARTING DISASTER SIMULATION")
        print("=" * 60)

        print(
            "Event ID:",
            disaster_event["event_id"]
        )

        print(
            "Disaster:",
            disaster_event["disaster"]
        )

        print(
            "Location:",
            disaster_event["location"]
        )

        print(
            "Severity:",
            disaster_event["severity"]
        )

        print(
            "Victims:",
            disaster_event["victims"]
        )

        print(
            "Traffic:",
            disaster_event["traffic_level"]
        )

        print("=" * 60)


        # =====================================================
        # RUN LANGGRAPH
        # =====================================================

        result = graph.invoke({

            "event":
                disaster_event,

            "responses":
                []

        })


        # =====================================================
        # ADD EVENT TO RESULT
        #
        # LangGraph may return the event,
        # but explicitly preserving it makes the
        # response predictable.
        # =====================================================

        result["event"] = (
            disaster_event
        )


        # =====================================================
        # WEBSOCKET
        # =====================================================

        set_simulation_data(
            result
        )


        print(
            "\n✅ SIMULATION COMPLETED"
        )

        print(
            "🧠 Event ready for MongoDB memory"
        )


        # =====================================================
        # RESPONSE
        # =====================================================

        return {

            "success":
                True,

            "message":
                "Simulation completed",

            "event":
                disaster_event,

            "data":
                result

        }


    except Exception as e:

        print(
            "❌ Simulation Error:",
            e
        )


        # =====================================================
        # FALLBACK
        # =====================================================

        fallback_event = {

            "event_id":
                str(uuid.uuid4()),

            "disaster":
                "Flood",

            "disaster_type":
                "Flood",

            "location":
                "Pune, Maharashtra",

            "traffic_level":
                70,

            "severity":
                8,

            "victims":
                30,

            "victim_estimate":
                30,

            "traffic_impact":
                "high",

            "medical_access_impact":
                "medium",

            "evacuation_required":
                True,

            "latitude":
                18.5204,

            "longitude":
                73.8567
        }


        fallback_result = {

            "event":
                fallback_event,

            "responses":
                []

        }


        set_simulation_data(
            fallback_result
        )


        return {

            "success":
                False,

            "message":
                "Simulation fallback completed",

            "event":
                fallback_event,

            "data":
                fallback_result,

            "error":
                str(e)

        }