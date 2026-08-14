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
        data,
        context
    ):

        self.set_status(
            "ANALYZING"
        )

        severity = data.get(
            "severity",
            1
        )

        evacuation_required = data.get(
            "evacuation_required",
            False
        )

        self.set_confidence(
            data.get(
                "confidence",
                0.94
            )
        )

        # ====================================================
        # HISTORICAL MEMORY
        # ====================================================

        historical_context = context.get(
            "historical_context",
            []
        )

        # ----------------------------------------------------
        # Analyze historical emergency patterns
        # ----------------------------------------------------

        historical_count = len(
            historical_context
        )

        previous_high_severity = sum(
            1
            for event in historical_context
            if event.get("severity", 0) >= 5
        )

        previous_critical_events = sum(
            1
            for event in historical_context
            if event.get("severity", 0) >= 8
        )

        previous_evacuations = sum(
            1
            for event in historical_context
            if event.get(
                "evacuation_required",
                False
            )
        )

        # ====================================================
        # DETERMINE EMERGENCY LEVEL
        # ====================================================

        if (
            severity >= 8
            or evacuation_required
        ):

            emergency_level = "critical"

        elif severity >= 5:

            emergency_level = "high"

        else:

            emergency_level = "normal"

        # ====================================================
        # MEMORY-BASED ESCALATION
        # ====================================================

        # If previous similar events were repeatedly severe,
        # increase monitoring even when current severity is
        # relatively lower.

        if (
            emergency_level == "normal"
            and previous_critical_events >= 2
        ):

            emergency_level = "high"

        # ====================================================
        # RETURN ANALYSIS
        # ====================================================

        return {

            "emergency_level":
                emergency_level,

            "severity":
                severity,

            "evacuation_required":
                evacuation_required,

            "historical_events_considered":
                historical_count,

            "previous_high_severity_events":
                previous_high_severity,

            "previous_critical_events":
                previous_critical_events,

            "previous_evacuations":
                previous_evacuations
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

        emergency_level = analysis[
            "emergency_level"
        ]

        evacuation_required = analysis[
            "evacuation_required"
        ]

        historical_events = analysis.get(
            "historical_events_considered",
            0
        )

        previous_critical = analysis.get(
            "previous_critical_events",
            0
        )

        # ====================================================
        # CRITICAL
        # ====================================================

        if emergency_level == "critical":

            if evacuation_required:

                return (
                    "Activate rescue teams "
                    "and initiate emergency evacuation"
                )

            return (
                "Activate rescue teams "
                "and establish immediate emergency response"
            )

        # ====================================================
        # HIGH
        # ====================================================

        if emergency_level == "high":

            if (
                historical_events > 0
                and previous_critical >= 1
            ):

                return (
                    "Deploy emergency response teams, "
                    "increase monitoring, and prepare "
                    "for rapid escalation based on "
                    "historical disaster patterns"
                )

            return (
                "Deploy emergency response "
                "teams and monitor escalation"
            )

        # ====================================================
        # NORMAL
        # ====================================================

        return (
            "Monitor situation and maintain "
            "emergency readiness"
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

            "decision":
                decision,

            "reasoning":
                reasoning
        }

        self.set_status(
            "COMPLETED"
        )

        return response