import random

import uuid

from shared.city_map import CITY_ZONES
class SimulationEngine:

    def __init__(self):

        self.disaster_types = [

            "Earthquake",

            "Flood",

            "Fire",

            "Chemical Leak",

            "Building Collapse"
        ]

    def generate_event(self):
        zone = random.choice(
            list(CITY_ZONES.keys())
        )
        coordinates = CITY_ZONES[zone]
        disaster = random.choice(
            self.disaster_types
        )

        severity = random.randint(1, 10)

        traffic_level = random.randint(30, 95)

        victims = random.randint(5, 50)

        return {

            "event_id": str(uuid.uuid4()),

            "disaster_type": disaster,

            "severity": severity,

            "traffic_level": traffic_level,

            "victims": victims,

            "zone": zone,

            "coordinates": coordinates
        }