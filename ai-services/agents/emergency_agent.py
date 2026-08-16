import time

from shared.base_agent import BaseAgent
from services.llm_service import generate_reasoning


class EmergencyAgent(BaseAgent):

    def __init__(self):

        super().__init__(
            "EmergencyAgent"
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

        disaster = event.get(
            "disaster",
            event.get(
                "disaster_type",
                "Unknown Disaster"
            )
        )

        location = event.get(
            "location",
            "Unknown"
        )

        # ----------------------------------------------------
        # HISTORICAL MEMORY
        # ----------------------------------------------------

        historical_context = context.get(
            "historical_context",
            []
        )

        historical_count = len(
            historical_context
        )

        historical_severities = [

            h.get(
                "severity",
                0
            )

            for h in historical_context

            if isinstance(
                h.get("severity", 0),
                (int, float)
            )
        ]

        previous_high_severity = any(
            severity >= 7
            for severity in historical_severities
        )

        average_historical_severity = 0

        if historical_severities:

            average_historical_severity = round(
                sum(historical_severities)
                /
                len(historical_severities),
                1
            )

        # ----------------------------------------------------
        # CONFIDENCE
        # ----------------------------------------------------

        self.set_confidence(
            event.get(
                "confidence",
                0.94
            )
        )

        # ----------------------------------------------------
        # DETERMINE EMERGENCY LEVEL
        # ----------------------------------------------------

        if (
            severity >= 8
            or evacuation_required
        ):

            emergency_level = "critical"

        elif severity >= 5:

            emergency_level = "high"

        else:

            emergency_level = "normal"

        # ----------------------------------------------------
        # HISTORICAL RISK
        # ----------------------------------------------------

        historical_risk = "low"

        if previous_high_severity:

            historical_risk = "high"

        elif (
            average_historical_severity >= 5
        ):

            historical_risk = "medium"

        # ----------------------------------------------------
        # AGENT COMMUNICATION
        # ----------------------------------------------------

        communication_manager = context.get(
            "communication_manager"
        )

        if communication_manager:

            if emergency_level == "critical":

                communication_manager.send_message(

                    sender=self.name,

                    receiver="MedicalAgent",

                    message=(
                        f"Critical {disaster} detected "
                        f"in {location}. "
                        f"Severity {severity}/10. "
                        f"Medical preparedness required."
                    )
                )

                communication_manager.send_message(

                    sender=self.name,

                    receiver="ResourceAgent",

                    message=(
                        f"Critical emergency detected "
                        f"in {location}. "
                        f"Coordinate rescue resources "
                        f"and evacuation support."
                    )
                )

        return {

            "emergency_level":
                emergency_level,

            "severity":
                severity,

            "evacuation_required":
                evacuation_required,

            "disaster":
                disaster,

            "location":
                location,

            "historical_count":
                historical_count,

            "historical_risk":
                historical_risk,

            "average_historical_severity":
                average_historical_severity,

            "previous_high_severity":
                previous_high_severity
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

        emergency_level = analysis[
            "emergency_level"
        ]

        evacuation_required = analysis[
            "evacuation_required"
        ]

        disaster = analysis[
            "disaster"
        ]

        location = analysis[
            "location"
        ]

        historical_risk = analysis[
            "historical_risk"
        ]

        # ====================================================
        # CRITICAL
        # ====================================================

        if emergency_level == "critical":

            if evacuation_required:

                return (
                    f"Activate rescue teams and "
                    f"initiate emergency evacuation "
                    f"in {location}, prioritizing "
                    f"high-risk areas affected by "
                    f"{disaster}"
                )

            if historical_risk == "high":

                return (
                    f"Activate emergency rescue teams "
                    f"in {location} and prepare for "
                    f"rapid escalation based on "
                    f"previous severe disaster patterns"
                )

            return (
                f"Activate rescue teams in {location} "
                f"and establish immediate emergency "
                f"response operations"
            )

        # ====================================================
        # HIGH
        # ====================================================

        if emergency_level == "high":

            if historical_risk in (
                "medium",
                "high"
            ):

                return (
                    f"Deploy emergency response teams "
                    f"in {location} and closely monitor "
                    f"for escalation using historical "
                    f"{disaster} patterns"
                )

            return (
                f"Deploy emergency response teams "
                f"in {location} and monitor escalation"
            )

        # ====================================================
        # NORMAL
        # ====================================================

        return (
            f"Monitor the {disaster} situation "
            f"in {location} and maintain emergency "
            f"response readiness"
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

        historical_context = event.get(
            "historical_context",
            []
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

                "evacuation_required":
                    event.get(
                        "evacuation_required",
                        False
                    ),

                "location":
                    event.get(
                        "location",
                        "Unknown"
                    ),

                "historical_events":
                    len(
                        historical_context
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