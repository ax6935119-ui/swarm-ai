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

    # =========================================================
    # GRAPH
    # =========================================================

    def build_city_graph(self):

        self.city_graph.add_weighted_edges_from([

            ("Hospital", "SectorA", 4),

            ("Hospital", "SectorB", 2),

            ("SectorA", "SectorC", 5),

            ("SectorB", "SectorC", 1),

            ("SectorC", "DisasterZone", 3),

            ("SectorB", "DisasterZone", 8)

        ])

    # =========================================================
    # ANALYZE
    # =========================================================

    def analyze(
        self,
        event,
        context
    ):

        self.set_status(
            "ANALYZING"
        )

        # =====================================================
        # TRAFFIC LEVEL
        # =====================================================

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

        # =====================================================
        # DISASTER ZONE
        # =====================================================

        disaster_zone = event.get(
            "zone",
            "DisasterZone"
        )

        # =====================================================
        # LOCATION
        # =====================================================

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

        # =====================================================
        # CONFIDENCE
        # =====================================================

        self.set_confidence(
            event.get(
                "confidence",
                0.82
            )
        )

        # =====================================================
        # HISTORICAL MEMORY
        # =====================================================

        historical_context = context.get(
            "historical_context",
            []
        )

        historical_count = len(
            historical_context
        )

        historical_high_traffic = sum(

            1

            for historical in historical_context

            if historical.get(
                "traffic_impact"
            ) == "high"

        )

        historical_medium_traffic = sum(

            1

            for historical in historical_context

            if historical.get(
                "traffic_impact"
            ) == "medium"

        )

        # =====================================================
        # HISTORICAL LOCATION MATCHES
        # =====================================================

        current_location = event.get(
            "location",
            "Unknown"
        )

        historical_location_matches = sum(

            1

            for historical in historical_context

            if historical.get(
                "location"
            ) == current_location

        )

        # =====================================================
        # AGENT COMMUNICATION
        # =====================================================

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

                message=
                f"Heavy traffic detected near "
                f"{disaster_zone}. "
                f"Additional emergency routing "
                f"may be required."

            )

        # =====================================================
        # RETURN ANALYSIS
        # =====================================================

        return {

            "traffic_level":
                traffic_level,

            "disaster_zone":
                disaster_zone,

            "latitude":
                scenario_lat,

            "longitude":
                scenario_lng,

            "historical_events_considered":
                historical_count,

            "historical_high_traffic":
                historical_high_traffic,

            "historical_medium_traffic":
                historical_medium_traffic,

            "historical_location_matches":
                historical_location_matches
        }

    # =========================================================
    # DECIDE
    # =========================================================

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

        historical_high_traffic = analysis.get(
            "historical_high_traffic",
            0
        )

        historical_location_matches = analysis.get(
            "historical_location_matches",
            0
        )

        # =====================================================
        # HISTORICAL TRAFFIC ESCALATION
        # =====================================================

        if (

            traffic_level <= 70

            and

            historical_high_traffic >= 2

            and

            historical_location_matches >= 1

        ):

            traffic_level = 75

        # =====================================================
        # ROUTE
        # =====================================================

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

        # =====================================================
        # ROUTE COORDINATES
        # =====================================================

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

        # =====================================================
        # REAL-WORLD LOCATION
        # =====================================================

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

        # =====================================================
        # LEGACY CITY SCENARIO
        # =====================================================

        else:

            for location in shortest_path:

                if location in CITY_ZONES:

                    route_coordinates.append({

                        "zone":
                            location,

                        "lat":
                            CITY_ZONES[
                                location
                            ]["lat"],

                        "lng":
                            CITY_ZONES[
                                location
                            ]["lng"]

                    })

        # =====================================================
        # DEBUG
        # =====================================================

        print(
            "\nTrafficAgent Route:"
        )

        print(
            "   Status:",
            route_status
        )

        print(
            "   Path:",
            shortest_path
        )

        print(
            "   Coordinates:",
            route_coordinates
        )

        # =====================================================
        # RETURN
        # =====================================================

        return {

            "route_status":
                route_status,

            "best_route":
                shortest_path,

            "route_coordinates":
                route_coordinates

        }

    # =========================================================
    # RESPOND
    # =========================================================

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

            decision,

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
                        0
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
            time.time() - start_time,
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
                    ]

            },

            "reasoning":
                reasoning
        }

        self.set_status(
            "COMPLETED"
        )

        return response