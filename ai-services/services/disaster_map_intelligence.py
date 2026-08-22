DISASTER_CONFIG = {
    "flood": {
        "search_places": [
            "hospital",
            "shelter",
            "medical",
            "fire_station"
        ],
        "resources": [
            "ambulance",
            "rescue_boat",
            "medical_team"
        ],
        "danger_radius": 2500,
        "priority": "medical_and_evacuation"
    },

    "fire": {
        "search_places": [
            "fire_station",
            "hospital",
            "shelter"
        ],
        "resources": [
            "fire_truck",
            "ambulance",
            "firefighters"
        ],
        "danger_radius": 1500,
        "priority": "fire_response"
    },

    "earthquake": {
        "search_places": [
            "hospital",
            "shelter",
            "fire_station"
        ],
        "resources": [
            "ambulance",
            "rescue_team",
            "medical_team",
            "firefighters"
        ],
        "danger_radius": 4000,
        "priority": "search_and_rescue"
    },

    "accident": {
        "search_places": [
            "hospital",
            "police_station",
            "fire_station"
        ],
        "resources": [
            "ambulance",
            "police_unit"
        ],
        "danger_radius": 500,
        "priority": "medical_response"
    },

    "landslide": {
        "search_places": [
            "hospital",
            "shelter",
            "fire_station"
        ],
        "resources": [
            "rescue_team",
            "ambulance",
            "excavator"
        ],
        "danger_radius": 2000,
        "priority": "rescue"
    }
}


def get_disaster_config(
    disaster_type: str
):

    disaster_type = (
        disaster_type
        .lower()
        .strip()
    )

    for key, config in DISASTER_CONFIG.items():

        if key in disaster_type:

            return config

    return {
        "search_places": [
            "hospital",
            "shelter",
            "fire_station"
        ],

        "resources": [
            "ambulance",
            "medical_team"
        ],

        "danger_radius": 1000,

        "priority": "general_emergency"
    }