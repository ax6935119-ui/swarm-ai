import time
import networkx as nx

from shared.base_agent import BaseAgent
from shared.city_map import CITY_ZONES
from services.llm_service import generate_reasoning


class TrafficAgent(BaseAgent):

    def __init__(self):

        super().__init__(
            "TrafficAgent"
        )

        self.city_graph = nx.Graph()

        self.build_city_graph()

    # ========================================================
    # GRAPH
    # ========================================================

    def build_city_graph(self):

        self.city_graph.add_weighted_edges_from([

            ("Hospital", "SectorA", 4),

            ("Hospital", "SectorB", 2),

            ("SectorA", "SectorC", 5),

            ("SectorB", "SectorC", 1),

            ("SectorC", "DisasterZone", 3),

            ("SectorB", "DisasterZone", 8)

        ])

    # ========================================================
    # ANALYZE
    # ========================================================

    def analyze(
        self,
        event,
        context
    ):

        self.set_status(
            "ANALYZING"
        )

        # ====================================================
        # TRAFFIC
        # ====================================================

        traffic_level = event.get(
            "traffic_level"
        )

        if traffic_level is None:

            traffic_impact = event.get(
                "traffic_impact",
                "low"
            )

            traffic_mapping = {

                "low": 30,

                "medium": 60,

                "high": 85

            }

            traffic_level = traffic_mapping.get(
                traffic_impact,
                30
            )

        # ====================================================
        # DISASTER
        # ====================================================

        disaster_zone = event.get(
            "zone",
            "DisasterZone"
        )

        location = event.get(
            "location",
            "Unknown"
        )

        disaster = event.get(
            "disaster",
            event.get(
                "disaster_type",
                "Unknown Disaster"
            )
        )

        severity = event.get(
            "severity",
            0
        )

        # ====================================================
        # COORDINATES
        # ====================================================

        scenario_lat = event.get(
            "latitude"
        )

        if scenario_lat is None:

            scenario_lat = event.get(
                "lat"
            )

        scenario_lng = event.get(
            "longitude"
        )

        if scenario_lng is None:

            scenario_lng = event.get(
                "lng"
            )

        self.set_confidence(
            event.get(
                "confidence",
                0.82
            )
        )

        # ====================================================
        # TRAFFIC RISK
        # ====================================================

        if traffic_level >= 80:

            traffic_risk = "critical"

        elif traffic_level >= 60:

            traffic_risk = "high"

        elif traffic_level >= 40:

            traffic_risk = "medium"

        else:

            traffic_risk = "low"

        # ====================================================
        # COMMUNICATION
        # ====================================================

        communication_manager = context.get(
            "communication_manager"
        )

        if (
            traffic_level > 70
            and communication_manager
        ):

            communication_manager.send_message(

                sender=self.name,

                receiver="ResourceAgent",

                message=(
                    f"Heavy traffic detected near "
                    f"{location}. Traffic level: "
                    f"{traffic_level}/100. "
                    f"Alternate emergency routing "
                    f"should be prioritized."
                )
            )

        return {

            "traffic_level":
                traffic_level,

            "traffic_risk":
                traffic_risk,

            "disaster_zone":
                disaster_zone,

            "location":
                location,

            "disaster":
                disaster,

            "severity":
                severity,

            "latitude":
                scenario_lat,

            "longitude":
                scenario_lng
        }

    # ========================================================
    # DECIDE
    # ========================================================

    def decide(
        self,
        analysis
    ):

        self.set_status(
            "DECIDING"
        )

        traffic_level = analysis[
            "traffic_level"
        ]

        disaster_zone = analysis[
            "disaster_zone"
        ]

        location = analysis[
            "location"
        ]

        # ====================================================
        # ROUTE
        # ====================================================

        if traffic_level > 70:

            shortest_path = nx.shortest_path(

                self.city_graph,

                source="Hospital",

                target="DisasterZone",

                weight="weight"

            )

            route_status = (
                "Alternate Route Activated"
            )

        else:

            shortest_path = [

                "Hospital",

                "SectorB",

                "DisasterZone"

            ]

            route_status = (
                "Normal Route"
            )

        # ====================================================
        # COORDINATES
        # ====================================================

        route_coordinates = []

        scenario_lat = analysis.get(
            "latitude"
        )

        scenario_lng = analysis.get(
            "longitude"
        )

        has_scenario_coordinates = (

            scenario_lat is not None

            and

            scenario_lng is not None

        )

        if has_scenario_coordinates:

            scenario_lat = float(
                scenario_lat
            )

            scenario_lng = float(
                scenario_lng
            )

            route_coordinates = [

                {

                    "zone":
                        "Response Base",

                    "lat":
                        scenario_lat - 0.02,

                    "lng":
                        scenario_lng - 0.02

                },

                {

                    "zone":
                        "Emergency Sector",

                    "lat":
                        scenario_lat - 0.01,

                    "lng":
                        scenario_lng - 0.01

                },

                {

                    "zone":
                        "DisasterZone",

                    "lat":
                        scenario_lat,

                    "lng":
                        scenario_lng

                }

            ]

        else:

            for location_name in shortest_path:

                if location_name in CITY_ZONES:

                    route_coordinates.append({

                        "zone":
                            location_name,

                        "lat":
                            CITY_ZONES[
                                location_name
                            ]["lat"],

                        "lng":
                            CITY_ZONES[
                                location_name
                            ]["lng"]

                    })

        # ====================================================
        # DECISION
        # ====================================================

        if traffic_level > 70:

            recommendation = (
                f"Activate alternate emergency "
                f"route to {location} and prioritize "
                f"ambulances, rescue vehicles and "
                f"medical transportation"
            )

        elif traffic_level >= 50:

            recommendation = (
                f"Monitor congestion near {location} "
                f"and prepare alternate emergency "
                f"routing"
            )

        else:

            recommendation = (
                f"Maintain normal emergency routing "
                f"to {location}"
            )

        return {

            "route_status":
                route_status,

            "best_route":
                shortest_path,

            "route_coordinates":
                route_coordinates,

            "recommendation":
                recommendation,

            "traffic_level":
                traffic_level,

            "disaster_zone":
                disaster_zone

        }

    # ========================================================
    # RESPOND
    # ========================================================

    def respond(
        self,
        decision,
        event
    ):

        self.set_status(
            "RESPONDING"
        )

        start_time = time.time()

        reasoning = generate_reasoning(

            self.name,

            decision.get(
                "recommendation",
                "Optimize emergency routing"
            ),

            {

                "disaster":
                    event.get(
                        "disaster",
                        event.get(
                            "disaster_type",
                            "Unknown"
                        )
                    ),

                "severity":
                    event.get(
                        "severity",
                        0
                    ),

                "traffic_level":
                    event.get(
                        "traffic_level",
                        decision.get(
                            "traffic_level",
                            0
                        )
                    ),

                "traffic_impact":
                    event.get(
                        "traffic_impact",
                        "low"
                    ),

                "location":
                    event.get(
                        "location",
                        "Unknown"
                    )

            }
        )

        execution_time = round(

            time.time()
            -
            start_time,

            3
        )

        response = {

            "agent":
                self.name,

            "status":
                self.get_status(),

            "confidence":
                self.get_confidence(),

            "execution_time":
                f"{execution_time}s",

            "decision":
                decision,

            "traffic_response": {

                "route_status":
                    decision[
                        "route_status"
                    ],

                "best_route":
                    decision[
                        "best_route"
                    ],

                "route_coordinates":
                    decision[
                        "route_coordinates"
                    ],

                "recommendation":
                    decision[
                        "recommendation"
                    ]

            },

            "reasoning":
                reasoning
        }

        self.set_status(
            "COMPLETED"
        )

        return response