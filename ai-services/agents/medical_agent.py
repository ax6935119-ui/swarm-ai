import time

from shared.base_agent import BaseAgent
from services.llm_service import generate_reasoning


class MedicalAgent(BaseAgent):

    def __init__(self):

        super().__init__(
            "MedicalAgent"
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

        # ====================================================
        # CURRENT EVENT
        # ====================================================

        victims = event.get(
            "victim_estimate"
        )

        if victims is None:

            victims = event.get(
                "victims",
                0
            )

        medical_access_impact = event.get(
            "medical_access_impact",
            "low"
        )

        self.set_confidence(
            event.get(
                "confidence",
                0.91
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

        # ----------------------------------------------------
        # Previous victim counts
        # ----------------------------------------------------

        historical_victims = []

        for historical in historical_context:

            previous_victims = historical.get(
                "victim_estimate"
            )

            if previous_victims is None:

                previous_victims = historical.get(
                    "victims",
                    0
                )

            if isinstance(
                previous_victims,
                (int, float)
            ):

                historical_victims.append(
                    previous_victims
                )

        # ====================================================
        # HISTORICAL MEDICAL IMPACT
        # ====================================================

        previous_high_medical_impact = sum(

            1

            for historical in historical_context

            if historical.get(
                "medical_access_impact"
            ) == "high"

        )

        previous_medium_medical_impact = sum(

            1

            for historical in historical_context

            if historical.get(
                "medical_access_impact"
            ) == "medium"

        )

        # ====================================================
        # HISTORICAL VICTIM AVERAGE
        # ====================================================

        average_historical_victims = 0

        if historical_victims:

            average_historical_victims = (
                sum(historical_victims)
                /
                len(historical_victims)
            )

        # ====================================================
        # RETURN ANALYSIS
        # ====================================================

        return {

            "victims":
                victims,

            "medical_access_impact":
                medical_access_impact,

            "historical_events_considered":
                historical_count,

            "average_historical_victims":
                average_historical_victims,

            "previous_high_medical_impact":
                previous_high_medical_impact,

            "previous_medium_medical_impact":
                previous_medium_medical_impact
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

        victims = analysis[
            "victims"
        ]

        medical_impact = analysis[
            "medical_access_impact"
        ]

        average_historical_victims = analysis.get(
            "average_historical_victims",
            0
        )

        previous_high_impact = analysis.get(
            "previous_high_medical_impact",
            0
        )

        # ====================================================
        # HIGH MEDICAL ACCESS IMPACT
        # ====================================================

        if medical_impact == "high":

            return (
                "Deploy emergency medical teams "
                "and establish alternate medical access"
            )

        # ====================================================
        # LARGE CURRENT VICTIM COUNT
        # ====================================================

        if (
            isinstance(victims, (int, float))
            and victims > 20
        ):

            return (
                "Deploy emergency medical teams "
                "and prepare additional hospital capacity"
            )

        # ====================================================
        # HISTORICAL HIGH MEDICAL IMPACT
        # ====================================================

        if (
            previous_high_impact >= 2
            and average_historical_victims > 10
        ):

            return (
                "Pre-position emergency medical teams "
                "and prepare additional hospital capacity "
                "based on historical disaster patterns"
            )

        # ====================================================
        # HISTORICAL VICTIM PATTERN
        # ====================================================

        if (
            average_historical_victims > 20
            and isinstance(victims, (int, float))
            and victims > 0
        ):

            return (
                "Deploy additional medical resources "
                "due to historically high victim levels"
            )

        # ====================================================
        # MODERATE IMPACT
        # ====================================================

        if medical_impact == "medium":

            return (
                "Prepare local hospitals "
                "and medical response teams"
            )

        # ====================================================
        # NORMAL
        # ====================================================

        return (
            "Prepare local hospitals"
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
                        "Unknown"
                    ),

                "disaster_type":
                    event.get(
                        "disaster_type",
                        "Unknown"
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