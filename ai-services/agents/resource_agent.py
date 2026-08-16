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

        severity = event.get(
            "severity",
            1
        )

        evacuation_required = event.get(
            "evacuation_required",
            False
        )

        traffic_impact = event.get(
            "traffic_impact",
            "low"
        )

        traffic_level = event.get(
            "traffic_level",
            0
        )

        medical_access_impact = event.get(
            "medical_access_impact",
            "low"
        )

        victims = event.get(
            "victim_estimate"
        )

        if victims is None:

            victims = event.get(
                "victims",
                0
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

        self.set_confidence(
            event.get(
                "confidence",
                0.88
            )
        )

        # ====================================================
        # HISTORICAL MEMORY
        # ====================================================

        historical_context = context.get(
            "historical_context",
            []
        )

        historical_count = len(
            historical_context
        )

        historical_severities = []

        historical_victims = []

        for historical in historical_context:

            h_severity = historical.get(
                "severity"
            )

            h_victims = historical.get(
                "victims"
            )

            if isinstance(
                h_severity,
                (int, float)
            ):

                historical_severities.append(
                    h_severity
                )

            if isinstance(
                h_victims,
                (int, float)
            ):

                historical_victims.append(
                    h_victims
                )

        average_historical_severity = 0

        average_historical_victims = 0

        if historical_severities:

            average_historical_severity = round(

                sum(
                    historical_severities
                )
                /
                len(
                    historical_severities
                ),

                1
            )

        if historical_victims:

            average_historical_victims = round(

                sum(
                    historical_victims
                )
                /
                len(
                    historical_victims
                ),

                1
            )

        # ====================================================
        # RESOURCE PRIORITY
        # ====================================================

        priority = "normal"

        if (
            severity >= 8
            or evacuation_required
            or medical_access_impact == "high"
            or traffic_level >= 80
        ):

            priority = "critical"

        elif (
            severity >= 6
            or traffic_level >= 60
            or medical_access_impact == "medium"
        ):

            priority = "high"

        # ====================================================
        # RESOURCE TYPES
        # ====================================================

        resources = []

        if (
            severity >= 7
            or evacuation_required
        ):

            resources.extend([

                "rescue teams",

                "evacuation vehicles",

                "emergency shelters"

            ])

        if (
            medical_access_impact
            in (
                "medium",
                "high"
            )
            or
            (
                isinstance(
                    victims,
                    (int, float)
                )
                and victims > 20
            )
        ):

            resources.extend([

                "medical teams",

                "medical supplies",

                "ambulances"

            ])

        if traffic_level >= 60:

            resources.extend([

                "emergency transportation",

                "alternate routing support"

            ])

        if not resources:

            resources.append(
                "limited emergency response units"
            )

        # ====================================================
        # HISTORICAL RISK
        # ====================================================

        historical_risk = "low"

        if (
            average_historical_severity >= 7
            or
            average_historical_victims >= 30
        ):

            historical_risk = "high"

        elif (
            average_historical_severity >= 5
            or
            average_historical_victims >= 15
        ):

            historical_risk = "medium"

        # ====================================================
        # AGENT COMMUNICATION
        # ====================================================

        communication_manager = context.get(
            "communication_manager"
        )

        if communication_manager:

            if priority == "critical":

                communication_manager.send_message(

                    sender=self.name,

                    receiver="EmergencyAgent",

                    message=(
                        f"Critical resource allocation "
                        f"required in {location}. "
                        f"Priority resources: "
                        f"{', '.join(resources)}."
                    )
                )

        return {

            "severity":
                severity,

            "evacuation_required":
                evacuation_required,

            "traffic_impact":
                traffic_impact,

            "traffic_level":
                traffic_level,

            "medical_access_impact":
                medical_access_impact,

            "victims":
                victims,

            "location":
                location,

            "disaster":
                disaster,

            "priority":
                priority,

            "resources":
                resources,

            "historical_count":
                historical_count,

            "historical_risk":
                historical_risk,

            "average_historical_severity":
                average_historical_severity,

            "average_historical_victims":
                average_historical_victims
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

        severity = analysis[
            "severity"
        ]

        evacuation_required = analysis[
            "evacuation_required"
        ]

        traffic_level = analysis[
            "traffic_level"
        ]

        medical_access_impact = analysis[
            "medical_access_impact"
        ]

        victims = analysis[
            "victims"
        ]

        location = analysis[
            "location"
        ]

        disaster = analysis[
            "disaster"
        ]

        resources = analysis[
            "resources"
        ]

        historical_risk = analysis[
            "historical_risk"
        ]

        priority = analysis[
            "priority"
        ]

        resource_list = ", ".join(
            resources
        )

        # ====================================================
        # CRITICAL
        # ====================================================

        if priority == "critical":

            decision = (
                f"Deploy {resource_list} "
                f"in {location}. "
                f"Prioritize immediate rescue, "
                f"evacuation, medical support and "
                f"emergency transportation for the "
                f"{disaster} response"
            )

            if historical_risk == "high":

                decision += (
                    ". Increase resource readiness "
                    f"based on previous high-impact "
                    f"{disaster} events"
                )

            return decision

        # ====================================================
        # HIGH
        # ====================================================

        if priority == "high":

            decision = (
                f"Deploy additional {resource_list} "
                f"in {location} and maintain "
                f"emergency response readiness"
            )

            if (
                isinstance(
                    victims,
                    (int, float)
                )
                and victims > 0
            ):

                decision += (
                    f" for approximately "
                    f"{victims} affected people"
                )

            return decision

        # ====================================================
        # NORMAL
        # ====================================================

        return (
            f"Deploy limited emergency resources "
            f"in {location} and monitor the "
            f"{disaster} situation for escalation"
        )

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

        victims = event.get(
            "victim_estimate"
        )

        if victims is None:

            victims = event.get(
                "victims",
                0
            )

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

                "victims":
                    victims,

                "evacuation_required":
                    event.get(
                        "evacuation_required",
                        False
                    ),

                "traffic_impact":
                    event.get(
                        "traffic_impact",
                        "low"
                    ),

                "traffic_level":
                    event.get(
                        "traffic_level",
                        0
                    ),

                "medical_access_impact":
                    event.get(
                        "medical_access_impact",
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

            "reasoning":
                reasoning

        }

        self.set_status(
            "COMPLETED"
        )

        return response