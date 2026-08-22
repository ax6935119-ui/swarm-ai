import math


# ============================================================
# DEFAULT CITY ZONES
#
# These are kept for backward compatibility with the existing
# NetworkX graph and older simulation scenarios.
# ============================================================

CITY_ZONES = {

    "Hospital": {
        "lat": 18.5204,
        "lng": 73.8567,
        "type": "hospital"
    },

    "SectorA": {
        "lat": 18.5310,
        "lng": 73.8440,
        "type": "route"
    },

    "SectorB": {
        "lat": 18.5090,
        "lng": 73.8700,
        "type": "route"
    },

    "SectorC": {
        "lat": 18.5420,
        "lng": 73.8620,
        "type": "route"
    },

    "DisasterZone": {
        "lat": 18.5480,
        "lng": 73.8780,
        "type": "disaster"
    }

}


# ============================================================
# DISTANCE CALCULATION
# ============================================================

def calculate_distance_km(
    lat1,
    lng1,
    lat2,
    lng2
):

    earth_radius = 6371

    lat1 = math.radians(float(lat1))
    lng1 = math.radians(float(lng1))

    lat2 = math.radians(float(lat2))
    lng2 = math.radians(float(lng2))

    delta_lat = lat2 - lat1
    delta_lng = lng2 - lng1

    a = (

        math.sin(delta_lat / 2) ** 2

        +

        math.cos(lat1)
        *
        math.cos(lat2)
        *
        math.sin(delta_lng / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return round(
        earth_radius * c,
        2
    )


# ============================================================
# NORMALIZE FACILITY
# ============================================================

def normalize_facility(
    facility,
    disaster_lat,
    disaster_lng
):

    try:

        lat = float(
            facility.get("lat")
        )

        lng = float(
            facility.get("lng")
        )

    except (
        TypeError,
        ValueError
    ):

        return None

    distance_km = calculate_distance_km(
        disaster_lat,
        disaster_lng,
        lat,
        lng
    )

    return {

        "name":
            facility.get(
                "name",
                facility.get(
                    "zone",
                    "Emergency Facility"
                )
            ),

        "zone":
            facility.get(
                "zone",
                facility.get(
                    "name",
                    "Emergency Facility"
                )
            ),

        "type":
            str(
                facility.get(
                    "type",
                    "hospital"
                )
            ).lower(),

        "lat":
            lat,

        "lng":
            lng,

        "distance_km":
            distance_km,

        "capacity":
            facility.get(
                "capacity",
                50
            ),

        "priority":
            facility.get(
                "priority",
                0
            )
    }


# ============================================================
# GENERATE FALLBACK FACILITIES
#
# Used only when the backend does not receive real nearby
# facility data.
#
# These coordinates are generated around the actual disaster
# location, so Pune facilities will never be shown for Punjab,
# Chandigarh, Delhi, etc.
# ============================================================

def generate_local_facilities(
    latitude,
    longitude
):

    latitude = float(latitude)
    longitude = float(longitude)

    facilities = [

        {

            "name":
                "Nearby Emergency Hospital",

            "zone":
                "Nearby Emergency Hospital",

            "type":
                "hospital",

            "lat":
                latitude + 0.018,

            "lng":
                longitude + 0.014,

            "capacity":
                180,

            "priority":
                10
        },

        {

            "name":
                "Emergency Medical Center",

            "zone":
                "Emergency Medical Center",

            "type":
                "medical",

            "lat":
                latitude - 0.012,

            "lng":
                longitude + 0.016,

            "capacity":
                120,

            "priority":
                9
        },

        {

            "name":
                "Fire & Rescue Station",

            "zone":
                "Fire & Rescue Station",

            "type":
                "fire_station",

            "lat":
                latitude + 0.011,

            "lng":
                longitude + 0.008,

            "capacity":
                80,

            "priority":
                8
        },

        {

            "name":
                "Emergency Shelter",

            "zone":
                "Emergency Shelter",

            "type":
                "shelter",

            "lat":
                latitude - 0.016,

            "lng":
                longitude - 0.010,

            "capacity":
                300,

            "priority":
                7
        },

        {

            "name":
                "Relief Coordination Center",

            "zone":
                "Relief Coordination Center",

            "type":
                "relief_center",

            "lat":
                latitude + 0.025,

            "lng":
                longitude + 0.020,

            "capacity":
                250,

            "priority":
                6
        }

    ]

    normalized = []

    for facility in facilities:

        item = normalize_facility(
            facility,
            latitude,
            longitude
        )

        if item:

            normalized.append(
                item
            )

    return normalized


# ============================================================
# FIND NEARBY FACILITIES
#
# Priority:
#
# 1. Real facilities provided in event data
# 2. Existing CITY_ZONES when no disaster coordinates exist
# 3. Dynamic fallback facilities around actual disaster location
# ============================================================

def find_nearby_facilities(
    latitude=None,
    longitude=None,
    facilities=None
):

    # --------------------------------------------------------
    # NO SCENARIO COORDINATES
    # --------------------------------------------------------

    if (
        latitude is None
        or
        longitude is None
    ):

        result = []

        for name, data in CITY_ZONES.items():

            if data.get("type") == "route":
                continue

            result.append({

                "name":
                    name,

                "zone":
                    name,

                "type":
                    data.get(
                        "type",
                        "hospital"
                    ),

                "lat":
                    data["lat"],

                "lng":
                    data["lng"],

                "distance_km":
                    0,

                "capacity":
                    100,

                "priority":
                    5
            })

        return result

    latitude = float(latitude)
    longitude = float(longitude)

    # --------------------------------------------------------
    # REAL FACILITIES PROVIDED BY EVENT
    # --------------------------------------------------------

    if isinstance(
        facilities,
        list
    ) and facilities:

        result = []

        for facility in facilities:

            if not isinstance(
                facility,
                dict
            ):
                continue

            normalized = normalize_facility(
                facility,
                latitude,
                longitude
            )

            if normalized:

                result.append(
                    normalized
                )

        if result:

            return sorted(
                result,
                key=lambda item:
                    item["distance_km"]
            )

    # --------------------------------------------------------
    # DYNAMIC LOCAL FALLBACK
    # --------------------------------------------------------

    return generate_local_facilities(
        latitude,
        longitude
    )


# ============================================================
# SELECT FACILITIES BY TYPE
# ============================================================

def get_facilities_by_type(
    facilities,
    facility_types
):

    if isinstance(
        facility_types,
        str
    ):

        facility_types = [
            facility_types
        ]

    allowed = {

        str(item).lower()

        for item in facility_types
    }

    return [

        facility

        for facility in facilities

        if str(
            facility.get(
                "type",
                ""
            )
        ).lower() in allowed
    ]


# ============================================================
# SELECT BEST FACILITY
# ============================================================

def select_best_facility(
    facilities,
    preferred_types=None
):

    if not facilities:
        return None

    candidates = facilities

    if preferred_types:

        preferred = get_facilities_by_type(
            facilities,
            preferred_types
        )

        if preferred:

            candidates = preferred

    # Facility type priority comes from the active agent strategy.
    # Distance only breaks ties within the same response category.
    preferred_ranks = {
        str(facility_type).lower(): rank
        for rank, facility_type in enumerate(preferred_types or [])
    }

    def score(facility):

        distance_score = (
            float(
                facility.get(
                    "distance_km",
                    999
                )
            )
            *
            10
        )

        priority_bonus = (
            float(
                facility.get(
                    "priority",
                    0
                )
            )
            *
            2
        )

        capacity_bonus = (
            float(
                facility.get(
                    "capacity",
                    0
                )
            )
            /
            100
        )

        type_rank = preferred_ranks.get(
            str(facility.get("type", "")).lower(),
            len(preferred_ranks)
        )

        return (
            type_rank,
            distance_score - priority_bonus - capacity_bonus
        )

    return min(
        candidates,
        key=score
    )