import time
import networkx as nx

from shared.base_agent import BaseAgent

from shared.city_map import (
    CITY_ZONES,
    find_nearby_facilities,
    select_best_facility,
    get_facilities_by_type
)

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

            (
                "Hospital",
                "SectorA",
                4
            ),

            (
                "Hospital",
                "SectorB",
                2
            ),

            (
                "SectorA",
                "SectorC",
                5
            ),

            (
                "SectorB",
                "SectorC",
                1
            ),

            (
                "SectorC",
                "DisasterZone",
                3
            ),

            (
                "SectorB",
                "DisasterZone",
                8
            )

        ])

    # ========================================================
    # GET TRAFFIC LEVEL
    # ========================================================

    def get_traffic_level(
        self,
        event
    ):

        traffic_level = event.get(
            "traffic_level"
        )

        if traffic_level is not None:

            try:

                return max(

                    0,

                    min(
                        int(
                            traffic_level
                        ),
                        100
                    )
                )

            except (
                TypeError,
                ValueError
            ):

                pass

        traffic_impact = str(

            event.get(
                "traffic_impact",
                "low"
            )

        ).lower()

        mapping = {

            "low":
                30,

            "medium":
                60,

            "high":
                85
        }

        return mapping.get(
            traffic_impact,
            30
        )

    # ========================================================
    # GET SCENARIO COORDINATES
    # ========================================================

    def get_coordinates(
        self,
        event
    ):

        latitude = event.get(
            "latitude"
        )

        if latitude is None:

            latitude = event.get(
                "lat"
            )

        longitude = event.get(
            "longitude"
        )

        if longitude is None:

            longitude = event.get(
                "lng"
            )

        try:

            latitude = float(
                latitude
            )

            longitude = float(
                longitude
            )

            return {

                "latitude":
                    latitude,

                "longitude":
                    longitude
            }

        except (
            TypeError,
            ValueError
        ):

            return None

    # ========================================================
    # DETERMINE REQUIRED FACILITY
    # ========================================================

    def determine_facility_priority(
        self,
        disaster,
        severity,
        evacuation_required,
        medical_access_impact
    ):

        disaster = str(
            disaster
        ).lower()

        preferred_types = [

            "hospital",
            "medical"
        ]

        vehicle_type = (
            "ambulance"
        )

        # ----------------------------------------------------
        # FIRE
        # ----------------------------------------------------

        if any(

            keyword in disaster

            for keyword in [

                "fire",
                "wildfire",
                "explosion"
            ]

        ):

            preferred_types = [

                "fire_station",
                "hospital",
                "medical"
            ]

            vehicle_type = (
                "fire_rescue_vehicle"
            )

        # ----------------------------------------------------
        # EVACUATION
        # ----------------------------------------------------

        elif evacuation_required:

            preferred_types = [

                "shelter",
                "hospital",
                "medical"
            ]

            vehicle_type = (
                "evacuation_vehicle"
            )

        # ----------------------------------------------------
        # EARTHQUAKE / COLLAPSE
        # ----------------------------------------------------

        elif any(

            keyword in disaster

            for keyword in [

                "earthquake",
                "collapse",
                "building"
            ]

        ):

            preferred_types = [

                "hospital",
                "medical",
                "fire_station"
            ]

            vehicle_type = (
                "rescue_ambulance"
            )

        # ----------------------------------------------------
        # FLOOD / STORM
        # ----------------------------------------------------

        elif any(

            keyword in disaster

            for keyword in [

                "flood",
                "landslide",
                "storm",
                "cyclone"
            ]

        ):

            preferred_types = [

                "fire_station",
                "hospital",
                "shelter",
                "medical"
            ]

            vehicle_type = (
                "rescue_vehicle"
            )

        # ----------------------------------------------------
        # MEDICAL ACCESS
        # ----------------------------------------------------

        if medical_access_impact == "high":

            if "hospital" not in preferred_types:

                preferred_types.insert(
                    0,
                    "hospital"
                )

        return {

            "preferred_types":
                preferred_types,

            "vehicle_type":
                vehicle_type
        }

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

        traffic_level = self.get_traffic_level(
            event
        )

        if traffic_level >= 80:

            traffic_risk = (
                "critical"
            )

        elif traffic_level >= 60:

            traffic_risk = (
                "high"
            )

        elif traffic_level >= 40:

            traffic_risk = (
                "medium"
            )

        else:

            traffic_risk = (
                "low"
            )

        disaster = event.get(

            "disaster",

            event.get(
                "disaster_type",
                "Unknown Disaster"
            )
        )

        severity = int(

            event.get(
                "severity",
                0
            )

            or 0

        )

        evacuation_required = bool(

            event.get(
                "evacuation_required",
                False
            )

        )

        medical_access_impact = str(

            event.get(
                "medical_access_impact",
                "low"
            )

        ).lower()

        coordinates = self.get_coordinates(
            event
        )

        nearby_facilities = []

        # ====================================================
        # DYNAMIC FACILITY DISCOVERY
        # ====================================================

        if coordinates:

            nearby_facilities = find_nearby_facilities(

                latitude=
                    coordinates[
                        "latitude"
                    ],

                longitude=
                    coordinates[
                        "longitude"
                    ],

                facilities=
                    event.get(
                        "nearby_facilities"
                    )
            )

        else:

            nearby_facilities = find_nearby_facilities()

        facility_priority = (

            self.determine_facility_priority(

                disaster=
                    disaster,

                severity=
                    severity,

                evacuation_required=
                    evacuation_required,

                medical_access_impact=
                    medical_access_impact
            )

        )

        preferred_types = (

            facility_priority[
                "preferred_types"
            ]
        )

        selected_facility = (

            select_best_facility(

                nearby_facilities,

                preferred_types=
                    preferred_types
            )

        )

        self.set_confidence(

            float(

                event.get(
                    "confidence",
                    0.82
                )

                or 0.82

            )

        )

        # ====================================================
        # COMMUNICATION
        # ====================================================

        communication_manager = context.get(
            "communication_manager"
        )

        if (

            traffic_level >= 70

            and

            communication_manager

        ):

            communication_manager.send_message(

                sender=
                    self.name,

                receiver=
                    "ResourceAgent",

                message=(
                    f"Heavy traffic detected near "
                    f"{event.get('location', 'disaster zone')}. "
                    f"Selected facility: "
                    f"{selected_facility.get('name') if selected_facility else 'None'}. "
                    f"Alternate emergency routing should be prioritized."
                )
            )

        return {

            "traffic_level":
                traffic_level,

            "traffic_risk":
                traffic_risk,

            "location":
                event.get(
                    "location",
                    "Unknown"
                ),

            "disaster":
                disaster,

            "severity":
                severity,

            "evacuation_required":
                evacuation_required,

            "medical_access_impact":
                medical_access_impact,

            "coordinates":
                coordinates,

            "nearby_facilities":
                nearby_facilities,

            "selected_facility":
                selected_facility,

            "preferred_types":
                preferred_types,

            "vehicle_type":
                facility_priority[
                    "vehicle_type"
                ]
        }

    # ========================================================
    # BUILD ROUTE POINTS
    # ========================================================

    def build_dynamic_route(
        self,
        facility,
        disaster_coordinates,
        traffic_level
    ):

        if not facility:

            return []

        if not disaster_coordinates:

            return []

        disaster_lat = (
            disaster_coordinates[
                "latitude"
            ]
        )

        disaster_lng = (
            disaster_coordinates[
                "longitude"
            ]
        )

        facility_lat = float(
            facility["lat"]
        )

        facility_lng = float(
            facility["lng"]
        )

        if traffic_level >= 70:
            route_status = (
                "Alternate Route Activated"
            )

        elif traffic_level >= 40:
            route_status = (
                "Optimized Route Activated"
            )

        else:
            route_status = (
                "Normal Optimized Route"
            )

        route_coordinates = [

            {

                "zone":
                    facility.get(
                        "name",
                        "Emergency Facility"
                    ),

                "type":
                    facility.get(
                        "type",
                        "facility"
                    ),

                "lat":
                    facility_lat,

                "lng":
                    facility_lng
            }, {

                "zone":
                    "DisasterZone",

                "type":
                    "disaster",

                "lat":
                    disaster_lat,

                "lng":
                    disaster_lng
            }

        ]

        return route_coordinates, route_status

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

        selected_facility = analysis.get(
            "selected_facility"
        )

        disaster_coordinates = analysis.get(
            "coordinates"
        )

        route_coordinates = []

        route_status = (
            "Waiting for Route"
        )

        # ====================================================
        # REAL DYNAMIC ROUTE
        # ====================================================

        if (

            selected_facility

            and

            disaster_coordinates

        ):

            result = self.build_dynamic_route(

                facility=
                    selected_facility,

                disaster_coordinates=
                    disaster_coordinates,

                traffic_level=
                    traffic_level
            )

            if result:

                route_coordinates = (
                    result[0]
                )

                route_status = (
                    result[1]
                )

        # ====================================================
        # LEGACY FALLBACK
        #
        # Keeps your existing graph behaviour working.
        # ====================================================

        if not route_coordinates:

            if traffic_level > 70:

                best_route = nx.shortest_path(

                    self.city_graph,

                    source=
                        "Hospital",

                    target=
                        "DisasterZone",

                    weight=
                        "weight"
                )

                route_status = (
                    "Alternate Route Activated"
                )

            else:

                best_route = [

                    "Hospital",

                    "SectorB",

                    "DisasterZone"
                ]

                route_status = (
                    "Normal Route"
                )

            for location_name in best_route:

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
                            ]["lng"],

                        "type":
                            CITY_ZONES[
                                location_name
                            ].get(
                                "type",
                                "route"
                            )
                    })

        else:

            best_route = [

                point[
                    "zone"
                ]

                for point in route_coordinates
            ]

        # ====================================================
        # RECOMMENDATION
        # ====================================================

        selected_name = (

            selected_facility.get(
                "name"
            )

            if selected_facility

            else

            "nearest emergency facility"
        )

        if traffic_level >= 70:

            recommendation = (

                f"Activate alternate emergency route "
                f"from {selected_name} to the disaster "
                f"zone. Prioritize emergency vehicles "
                f"and avoid high-congestion corridors."
            )

        elif traffic_level >= 40:

            recommendation = (

                f"Use optimized route from "
                f"{selected_name} to the disaster zone "
                f"while continuously monitoring congestion."
            )

        else:

            recommendation = (

                f"Use the fastest available route from "
                f"{selected_name} to the disaster zone."
            )

        return {

            "route_status":
                route_status,

            "best_route":
                best_route,

            "route_coordinates":
                route_coordinates,

            "selected_facility":
                selected_facility,

            "nearby_facilities":
                analysis.get(
                    "nearby_facilities",
                    []
                ),

            "vehicle_type":
                analysis.get(
                    "vehicle_type",
                    "ambulance"
                ),

            "traffic_level":
                traffic_level,

            "traffic_risk":
                analysis.get(
                    "traffic_risk"
                ),

            "recommendation":
                recommendation
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
                "Optimize emergency routing."
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
                    decision.get(
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
                    ),

                "selected_facility":
                    (
                        decision.get(
                            "selected_facility"
                        )
                        or {}
                    ).get(
                        "name",
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

                "selected_facility":
                    decision.get(
                        "selected_facility"
                    ),

                "nearby_facilities":
                    decision.get(
                        "nearby_facilities",
                        []
                    ),

                "vehicle_type":
                    decision.get(
                        "vehicle_type",
                        "ambulance"
                    ),

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