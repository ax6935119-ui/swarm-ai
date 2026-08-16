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

        severity = event.get(
            "severity",
            1
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

        historical_victims = []

        for historical in historical_context:

            value = historical.get(
                "victims",
                0
            )

            if isinstance(
                value,
                (int, float)
            ):

                historical_victims.append(
                    value
                )

        average_historical_victims = 0

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

        historical_medical_risk = (
            "low"
        )

        if average_historical_victims >= 30:

            historical_medical_risk = "high"

        elif average_historical_victims >= 15:

            historical_medical_risk = "medium"

        # ====================================================
        # DETERMINE VICTIM RISK
        # ====================================================

        victim_risk = "low"

        if (
            isinstance(
                victims,
                (int, float)
            )
            and victims > 50
        ):

            victim_risk = "critical"

        elif (
            isinstance(
                victims,
                (int, float)
            )
            and victims > 20
        ):

            victim_risk = "high"

        elif (
            isinstance(
                victims,
                (int, float)
            )
            and victims > 5
        ):

            victim_risk = "medium"

        # ====================================================
        # AGENT COMMUNICATION
        # ====================================================

        communication_manager = context.get(
            "communication_manager"
        )

        if communication_manager:

            if (
                victim_risk in (
                    "critical",
                    "high"
                )
                or
                medical_access_impact == "high"
            ):

                communication_manager.send_message(

                    sender=self.name,

                    receiver="ResourceAgent",

                    message=(
                        f"Medical risk is {victim_risk} "
                        f"in {location}. "
                        f"Victims: {victims}. "
                        f"Medical access impact: "
                        f"{medical_access_impact}. "
                        f"Medical resources should "
                        f"be prioritized."
                    )
                )

        return {

            "victims":
                victims,

            "medical_access_impact":
                medical_access_impact,

            "severity":
                severity,

            "location":
                location,

            "disaster":
                disaster,

            "victim_risk":
                victim_risk,

            "historical_medical_risk":
                historical_medical_risk,

            "average_historical_victims":
                average_historical_victims,

            "historical_count":
                len(
                    historical_context
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

        victims = analysis[
            "victims"
        ]

        medical_impact = analysis[
            "medical_access_impact"
        ]

        severity = analysis[
            "severity"
        ]

        location = analysis[
            "location"
        ]

        disaster = analysis[
            "disaster"
        ]

        victim_risk = analysis[
            "victim_risk"
        ]

        historical_medical_risk = analysis[
            "historical_medical_risk"
        ]

        # ====================================================
        # CRITICAL MEDICAL RESPONSE
        # ====================================================

        if (
            medical_impact == "high"
            or victim_risk == "critical"
        ):

            return (
                f"Deploy emergency medical teams "
                f"in {location}, establish alternate "
                f"medical access and prepare hospitals "
                f"for a potentially large influx of "
                f"{disaster} casualties"
            )

        # ====================================================
        # HIGH VICTIM LOAD
        # ====================================================

        if victim_risk == "high":

            return (
                f"Deploy emergency medical teams "
                f"and prepare nearby hospitals in "
                f"{location} for approximately "
                f"{victims} affected people"
            )

        # ====================================================
        # HISTORICAL MEDICAL RISK
        # ====================================================

        if (
            historical_medical_risk == "high"
            and severity >= 6
        ):

            return (
                f"Pre-position medical teams and "
                f"supplies in {location} based on "
                f"previous high-impact disaster patterns"
            )

        # ====================================================
        # MEDIUM
        # ====================================================

        if (
            medical_impact == "medium"
            or victim_risk == "medium"
        ):

            return (
                f"Prepare local hospitals and "
                f"medical response teams in {location}"
            )

        # ====================================================
        # NORMAL
        # ====================================================

        return (
            f"Maintain medical readiness in "
            f"{location} and monitor casualty levels"
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