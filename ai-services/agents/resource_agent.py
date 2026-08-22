import time

from shared.base_agent import BaseAgent
from services.llm_service import generate_reasoning


class ResourceAgent(BaseAgent):

    def __init__(self):

        super().__init__(
            "ResourceAgent"
        )

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

        disaster = str(

            event.get(
                "disaster",
                event.get(
                    "disaster_type",
                    "Unknown Disaster"
                )
            )

        ).lower()

        severity = int(

            event.get(
                "severity",
                0
            )

            or 0

        )

        victim_estimate = event.get(
            "victim_estimate",
            event.get(
                "victims",
                0
            )
        )

        try:

            victim_estimate = int(
                victim_estimate
            )

        except (
            TypeError,
            ValueError
        ):

            victim_estimate = 0

        evacuation_required = bool(

            event.get(
                "evacuation_required",
                False
            )

        )

        traffic_impact = str(

            event.get(
                "traffic_impact",
                "low"
            )

        ).lower()

        medical_access_impact = str(

            event.get(
                "medical_access_impact",
                "low"
            )

        ).lower()

        self.set_confidence(

            float(

                event.get(
                    "confidence",
                    0.85
                )

                or 0.85

            )

        )

        return {

            "disaster":
                disaster,

            "severity":
                severity,

            "victim_estimate":
                victim_estimate,

            "evacuation_required":
                evacuation_required,

            "traffic_impact":
                traffic_impact,

            "medical_access_impact":
                medical_access_impact,

            "location":
                event.get(
                    "location",
                    "Unknown"
                )
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

        disaster = analysis[
            "disaster"
        ]

        severity = analysis[
            "severity"
        ]

        victims = analysis[
            "victim_estimate"
        ]

        evacuation_required = analysis[
            "evacuation_required"
        ]

        traffic_impact = analysis[
            "traffic_impact"
        ]

        medical_access_impact = analysis[
            "medical_access_impact"
        ]

        # ====================================================
        # BASE RESOURCE ALLOCATION
        # ====================================================

        ambulances = max(
            1,
            (victims + 9) // 10
        )

        rescue_teams = max(
            1,
            (severity + 1) // 2
        )

        medical_teams = max(
            1,
            (victims + 19) // 20
        )

        fire_units = 0
        evacuation_buses = 0
        shelter_capacity = 0

        # ====================================================
        # DISASTER-SPECIFIC ALLOCATION
        # ====================================================

        if any(

            keyword in disaster

            for keyword in [

                "fire",
                "wildfire",
                "explosion"
            ]

        ):

            fire_units = max(
                2,
                severity
            )

            rescue_teams += 1

        elif any(

            keyword in disaster

            for keyword in [

                "earthquake",
                "collapse",
                "building"
            ]

        ):

            rescue_teams += 2

            medical_teams += 1

        elif any(

            keyword in disaster

            for keyword in [

                "flood",
                "landslide",
                "storm",
                "cyclone"
            ]

        ):

            rescue_teams += 2

            if severity >= 6:

                evacuation_buses = max(
                    1,
                    severity // 2
                )

        # ====================================================
        # EVACUATION
        # ====================================================

        if evacuation_required:

            evacuation_buses = max(
                evacuation_buses,
                max(
                    1,
                    (victims + 39) // 40
                )
            )

            shelter_capacity = max(
                victims * 2,
                100
            )

        # ====================================================
        # MEDICAL ACCESS
        # ====================================================

        if medical_access_impact == "high":

            ambulances += 2

            medical_teams += 1

        elif medical_access_impact == "medium":

            ambulances += 1

        # ====================================================
        # TRAFFIC
        # ====================================================

        if traffic_impact == "high":

            ambulances += 1

            rescue_teams += 1

        # ====================================================
        # RESPONSE PRIORITY
        # ====================================================

        if severity >= 8:

            response_priority = (
                "CRITICAL"
            )

        elif severity >= 5:

            response_priority = (
                "HIGH"
            )

        elif severity >= 3:

            response_priority = (
                "MEDIUM"
            )

        else:

            response_priority = (
                "LOW"
            )

        # ====================================================
        # REQUIRED FACILITY TYPES
        # ====================================================

        required_facilities = [

            "hospital"
        ]

        if fire_units > 0:

            required_facilities.append(
                "fire_station"
            )

        if evacuation_required:

            required_facilities.append(
                "shelter"
            )

        return {

            "response_priority":
                response_priority,

            "resources": {

                "ambulances":
                    ambulances,

                "rescue_teams":
                    rescue_teams,

                "medical_teams":
                    medical_teams,

                "fire_units":
                    fire_units,

                "evacuation_buses":
                    evacuation_buses,

                "shelter_capacity":
                    shelter_capacity
            },

            "required_facilities":
                required_facilities,

            "recommendation":
                (
                    f"Deploy emergency resources to "
                    f"{analysis['location']}. "
                    f"Priority level: "
                    f"{response_priority}."
                )
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
                "Allocate emergency resources."
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

                "victims":
                    event.get(
                        "victim_estimate",
                        event.get(
                            "victims",
                            0
                        )
                    ),

                "traffic_impact":
                    event.get(
                        "traffic_impact",
                        "low"
                    ),

                "medical_access_impact":
                    event.get(
                        "medical_access_impact",
                        "low"
                    ),

                "evacuation_required":
                    event.get(
                        "evacuation_required",
                        False
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

            "resource_response": {

                "response_priority":
                    decision[
                        "response_priority"
                    ],

                "resources":
                    decision[
                        "resources"
                    ],

                "required_facilities":
                    decision[
                        "required_facilities"
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