from scenarios.disaster_scenarios import (
    get_scenario
)


def build_disaster_event(
    scenario
):
    """
    Convert a scenario into the event format
    already consumed by the SwarmAI agents.
    """

    return {

        "disaster":
            scenario.get(
                "disaster",
                "Unknown"
            ),

        "disaster_type":
            scenario.get(
                "disaster",
                "Unknown"
            ),

        "location":
            scenario.get(
                "location",
                "Unknown"
            ),

        "zone":
            scenario.get(
                "zone",
                "DisasterZone"
            ),

        "latitude":
            scenario.get(
                "latitude"
            ),

        "longitude":
            scenario.get(
                "longitude"
            ),

        "severity":
            scenario.get(
                "severity",
                0
            ),

        "victims":
            scenario.get(
                "victims",
                0
            ),

        "traffic_level":
            scenario.get(
                "traffic_level",
                0
            ),

        "description":
            scenario.get(
                "description",
                ""
            ),

        "source_type":
            scenario.get(
                "source_type",
                "simulation"
            ),

        "scenario_id":
            scenario.get(
                "id"
            ),

        "scenario_name":
            scenario.get(
                "name"
            )
    }


def create_event_from_scenario(
    scenario_id: str
):

    scenario = get_scenario(
        scenario_id
    )

    if not scenario:

        raise ValueError(
            f"Scenario '{scenario_id}' not found"
        )

    return build_disaster_event(
        scenario
    )