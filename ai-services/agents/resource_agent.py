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

        medical_access_impact = event.get(
            "medical_access_impact",
            "low"
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

        # ====================================================
        # HISTORICAL RESOURCE PRESSURE
        # ====================================================

        historical_severe_events = sum(

            1

            for historical in historical_context

            if historical.get(
                "severity",
                0
            ) >= 6

        )

        historical_evacuations = sum(

            1

            for historical in historical_context

            if historical.get(
                "evacuation_required",
                False
            )

        )

        historical_high_traffic = sum(

            1

            for historical in historical_context

            if (
                historical.get(
                    "traffic_impact"
                )
                == "high"
            )

        )

        historical_high_medical = sum(

            1

            for historical in historical_context

            if (
                historical.get(
                    "medical_access_impact"
                )
                == "high"
            )

        )

        # ====================================================
        # RETURN ANALYSIS
        # ====================================================

        return {

            "severity":
                severity,

            "evacuation_required":
                evacuation_required,

            "traffic_impact":
                traffic_impact,

            "medical_access_impact":
                medical_access_impact,

            "historical_events_considered":
                historical_count,

            "historical_severe_events":
                historical_severe_events,

            "historical_evacuations":
                historical_evacuations,

            "historical_high_traffic":
                historical_high_traffic,

            "historical_high_medical":
                historical_high_medical
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

        traffic_impact = analysis[
            "traffic_impact"
        ]

        medical_access_impact = analysis[
            "medical_access_impact"
        ]

        historical_severe_events = analysis.get(
            "historical_severe_events",
            0
        )

        historical_evacuations = analysis.get(
            "historical_evacuations",
            0
        )

        historical_high_traffic = analysis.get(
            "historical_high_traffic",
            0
        )

        historical_high_medical = analysis.get(
            "historical_high_medical",
            0
        )

        # ====================================================
        # CRITICAL RESPONSE
        # ====================================================

        if (

            severity >= 8

            and

            (
                evacuation_required

                or

                medical_access_impact == "high"

                or

                traffic_impact == "high"
            )

        ):

            return (
                "Deploy all emergency resources, "
                "prioritize evacuation, medical support "
                "and emergency transportation"
            )

        # ====================================================
        # HISTORICAL CRITICAL PRESSURE
        # ====================================================

        if (

            severity >= 6

            and

            historical_severe_events >= 2

            and

            (
                historical_high_traffic >= 1
                or
                historical_high_medical >= 1
            )

        ):

            return (
                "Deploy additional emergency resources "
                "and pre-position medical and "
                "transportation support based on "
                "historical disaster patterns"
            )

        # ====================================================
        # HISTORICAL EVACUATION PATTERN
        # ====================================================

        if (

            evacuation_required

            or

            historical_evacuations >= 2
        ):

            return (
                "Prepare evacuation resources, "
                "medical support and emergency "
                "transportation"
            )

        # ====================================================
        # HIGH RESPONSE
        # ====================================================

        if severity >= 6:

            return (
                "Deploy additional response units "
                "and prepare emergency resources"
            )

        # ====================================================
        # HIGH TRAFFIC
        # ====================================================

        if traffic_impact == "high":

            return (
                "Deploy additional traffic response "
                "and emergency transportation resources"
            )

        # ====================================================
        # HIGH MEDICAL IMPACT
        # ====================================================

        if medical_access_impact == "high":

            return (
                "Deploy additional medical response "
                "resources and alternate access support"
            )

        # ====================================================
        # NORMAL
        # ====================================================

        return (
            "Deploy limited response units"
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