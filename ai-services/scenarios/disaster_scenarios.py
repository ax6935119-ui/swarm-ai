"""
SwarmAI Real-World Disaster Scenarios

These scenarios are historical/reference scenarios used as
simulation inputs. They are NOT live emergency data.
"""

DISASTER_SCENARIOS = {

    "sikkim_glof_2023": {

        "id": "sikkim_glof_2023",

        "name":
            "Sikkim Glacial Lake Outburst Flood",

        "disaster":
            "Glacial Lake Outburst Flood",

        "location":
            "Sikkim, India",

        "zone":
            "DisasterZone",

        "latitude":
            27.9167,

        "longitude":
            88.5167,

        "severity":
            9,

        "victims":
            41,

        "traffic_level":
            85,

        "description":
            "Historical flood disaster scenario based on the "
            "2023 South Lhonak Lake glacial lake outburst flood "
            "in Sikkim.",

        "source_type":
            "historical_reference",

        "image_required":
            False
    },


    "pune_flood_simulation": {

        "id":
            "pune_flood_simulation",

        "name":
            "Pune Urban Flood Scenario",

        "disaster":
            "Flood",

        "location":
            "Pune, Maharashtra, India",

        "zone":
            "DisasterZone",

        "latitude":
            18.548,

        "longitude":
            73.878,

        "severity":
            8,

        "victims":
            40,

        "traffic_level":
            88,

        "description":
            "Urban flooding scenario affecting roads, "
            "residential areas and emergency routes in Pune.",

        "source_type":
            "simulation_reference",

        "image_required":
            False
    },


    "earthquake_scenario": {

        "id":
            "earthquake_scenario",

        "name":
            "Urban Earthquake Scenario",

        "disaster":
            "Earthquake",

        "location":
            "Pune, Maharashtra, India",

        "zone":
            "DisasterZone",

        "latitude":
            18.548,

        "longitude":
            73.878,

        "severity":
            9,

        "victims":
            65,

        "traffic_level":
            92,

        "description":
            "Urban earthquake response scenario involving "
            "building damage, injured victims and blocked roads.",

        "source_type":
            "simulation_reference",

        "image_required":
            False
    }

}


def get_all_scenarios():

    return list(
        DISASTER_SCENARIOS.values()
    )


def get_scenario(
    scenario_id: str
):

    return DISASTER_SCENARIOS.get(
        scenario_id
    )