import math
import requests


OVERPASS_URL = (
    "https://overpass-api.de/api/interpreter"
)


def calculate_distance(
    lat1,
    lon1,
    lat2,
    lon2
):
    """
    Calculate approximate distance in kilometers.
    """

    radius = 6371

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)

    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    delta_lat = lat2 - lat1
    delta_lon = lon2 - lon1

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1)
        *
        math.cos(lat2)
        *
        math.sin(delta_lon / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(a),
        math.sqrt(1 - a)
    )

    return round(
        radius * c,
        2
    )


def search_nearby_places(
    latitude,
    longitude,
    radius=8000
):
    """
    Search nearby emergency facilities.
    Radius is in meters.
    """

    query = f"""
    [out:json];

    (
      node
        ["amenity"="hospital"]
        (around:{radius},{latitude},{longitude});

      way
        ["amenity"="hospital"]
        (around:{radius},{latitude},{longitude});

      relation
        ["amenity"="hospital"]
        (around:{radius},{latitude},{longitude});

      node
        ["amenity"="fire_station"]
        (around:{radius},{latitude},{longitude});

      way
        ["amenity"="fire_station"]
        (around:{radius},{latitude},{longitude});

      relation
        ["amenity"="fire_station"]
        (around:{radius},{latitude},{longitude});

      node
        ["amenity"="shelter"]
        (around:{radius},{latitude},{longitude});

      way
        ["amenity"="shelter"]
        (around:{radius},{latitude},{longitude});

      relation
        ["amenity"="shelter"]
        (around:{radius},{latitude},{longitude});
    );

    out center;
    """

    try:

        response = requests.post(
            OVERPASS_URL,
            data=query,
            timeout=15
        )

        response.raise_for_status()

        data = response.json()

    except Exception as error:

        print(
            "⚠️ Nearby places search failed:",
            error
        )

        return {
            "hospitals": [],
            "fire_stations": [],
            "shelters": []
        }

    result = {
        "hospitals": [],
        "fire_stations": [],
        "shelters": []
    }

    for element in data.get(
        "elements",
        []
    ):

        tags = element.get(
            "tags",
            {}
        )

        amenity = tags.get(
            "amenity"
        )

        # ---------------------------------------------
        # GET COORDINATES
        # ---------------------------------------------

        if (
            "lat" in element
            and
            "lon" in element
        ):

            lat = element["lat"]
            lng = element["lon"]

        elif (
            "center" in element
        ):

            lat = element[
                "center"
            ].get(
                "lat"
            )

            lng = element[
                "center"
            ].get(
                "lon"
            )

        else:

            continue

        if (
            lat is None
            or
            lng is None
        ):
            continue

        # ---------------------------------------------
        # PLACE NAME
        # ---------------------------------------------

        name = tags.get(
            "name",
            "Unnamed Emergency Facility"
        )

        distance = calculate_distance(
            latitude,
            longitude,
            lat,
            lng
        )

        place = {

            "name":
                name,

            "lat":
                float(lat),

            "lng":
                float(lng),

            "distance_km":
                distance,

            "type":
                amenity
        }

        # ---------------------------------------------
        # CLASSIFY
        # ---------------------------------------------

        if amenity == "hospital":

            result[
                "hospitals"
            ].append(
                place
            )

        elif amenity == "fire_station":

            result[
                "fire_stations"
            ].append(
                place
            )

        elif amenity == "shelter":

            result[
                "shelters"
            ].append(
                place
            )

    # ---------------------------------------------
    # SORT BY DISTANCE
    # ---------------------------------------------

    for key in result:

        result[key].sort(
            key=lambda x:
                x["distance_km"]
        )

    return result