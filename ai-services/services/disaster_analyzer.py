
import base64
import json

from groq import Groq

from config.settings import GROQ_API_KEY


# ============================================================
# GROQ CLIENT
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY
)


# ============================================================
# VISION MODEL
# ============================================================

VISION_MODEL = "qwen/qwen3.6-27b"


# ============================================================
# DISASTER IMAGE ANALYZER
# ============================================================

async def analyze_disaster_image(
    image_bytes: bytes,
    content_type: str,
    location: str,
    description: str
):
    """
    Analyze a disaster image together with
    user-provided location and description.

    Returns compact structured disaster information.
    """

    try:

        print("\n" + "=" * 60)
        print("🧠 DISASTER VISION ANALYSIS STARTED")
        print("=" * 60)

        print(f"📍 Location: {location}")
        print(f"📝 Description: {description}")
        print(f"📷 Image type: {content_type}")
        print(f"📦 Image size: {len(image_bytes)} bytes")


        # ====================================================
        # ENCODE IMAGE
        # ====================================================

        encoded_image = base64.b64encode(
            image_bytes
        ).decode("utf-8")


        image_url = (
            f"data:{content_type};base64,"
            f"{encoded_image}"
        )


        # ====================================================
        # COMPACT VISION PROMPT
        # ====================================================

        prompt = f"""
You are a disaster assessment AI.

Analyze the uploaded image using the incident information below.

Location: {location}

Description: {description}

Rules:
- Base visual observations only on the image.
- Use the description as additional context.
- Do not invent victims.
- Do not claim the image proves the location.
- Severity must be an integer from 1 to 10.
- Confidence must be between 0 and 1.
- victim_estimate must be a number or null.
- evacuation_required must be true or false.
- traffic_impact must be low, medium, or high.
- medical_access_impact must be low, medium, or high.
- Keep observations, hazards and infrastructure_damage short.
- Return ONLY valid JSON.
- Do not include markdown.

Return exactly:

{{
  "disaster_type": "Flood",
  "severity": 1,
  "confidence": 0.0,
  "observations": [],
  "hazards": [],
  "infrastructure_damage": [],
  "evacuation_required": false,
  "victim_estimate": null,
  "traffic_impact": "low",
  "medical_access_impact": "low",
  "summary": ""
}}
"""


        # ====================================================
        # GROQ VISION REQUEST
        # ====================================================

        print("\n🧠 Sending request to Groq Vision...")


        response = client.chat.completions.create(

            model=VISION_MODEL,

            messages=[

                {
                    "role": "system",

                    "content":
                        "You are a concise disaster "
                        "assessment AI. Return only valid JSON."
                },

                {
                    "role": "user",

                    "content": [

                        {
                            "type": "text",

                            "text": prompt
                        },

                        {
                            "type": "image_url",

                            "image_url": {

                                "url": image_url

                            }

                        }

                    ]

                }

            ],

            temperature=0.1,

            # Give the model enough room to finish JSON.
            max_completion_tokens=2500,

            response_format={
                "type": "json_object"
            }

        )


        # ====================================================
        # EXTRACT RESPONSE
        # ====================================================

        raw_result = (
            response
            .choices[0]
            .message
            .content
        )


        print("\n🧠 RAW AI RESPONSE:")
        print(raw_result)


        # ====================================================
        # CHECK EMPTY RESPONSE
        # ====================================================

        if not raw_result:

            raise ValueError(
                "Vision model returned an empty response."
            )


        # ====================================================
        # PARSE JSON
        # ====================================================

        try:

            analysis = json.loads(
                raw_result
            )

        except json.JSONDecodeError as e:

            print(
                "\n❌ INVALID JSON FROM VISION MODEL"
            )

            print(
                "Raw response:",
                raw_result
            )

            raise ValueError(
                f"Vision model returned invalid JSON: {e}"
            )


        # ====================================================
        # NORMALIZE FIELDS
        # ====================================================

        analysis.setdefault(
            "disaster_type",
            "Unknown Disaster"
        )

        analysis.setdefault(
            "severity",
            0
        )

        analysis.setdefault(
            "confidence",
            0
        )

        analysis.setdefault(
            "observations",
            []
        )

        analysis.setdefault(
            "hazards",
            []
        )

        analysis.setdefault(
            "infrastructure_damage",
            []
        )

        analysis.setdefault(
            "evacuation_required",
            False
        )

        analysis.setdefault(
            "victim_estimate",
            None
        )

        analysis.setdefault(
            "traffic_impact",
            "low"
        )

        analysis.setdefault(
            "medical_access_impact",
            "low"
        )

        analysis.setdefault(
            "summary",
            ""
        )


        # ====================================================
        # TYPE NORMALIZATION
        # ====================================================

        try:

            analysis["severity"] = int(
                analysis["severity"]
            )

        except (ValueError, TypeError):

            analysis["severity"] = 0


        analysis["severity"] = max(
            0,
            min(
                analysis["severity"],
                10
            )
        )


        try:

            analysis["confidence"] = float(
                analysis["confidence"]
            )

        except (ValueError, TypeError):

            analysis["confidence"] = 0.0


        analysis["confidence"] = max(
            0.0,
            min(
                analysis["confidence"],
                1.0
            )
        )


        # ====================================================
        # ENSURE LIST FIELDS
        # ====================================================

        for field in [
            "observations",
            "hazards",
            "infrastructure_damage"
        ]:

            if not isinstance(
                analysis[field],
                list
            ):

                analysis[field] = []


        # ====================================================
        # NORMALIZE ENUM FIELDS
        # ====================================================

        allowed_impact = {
            "low",
            "medium",
            "high"
        }


        if (
            analysis["traffic_impact"]
            not in allowed_impact
        ):

            analysis["traffic_impact"] = "low"


        if (
            analysis["medical_access_impact"]
            not in allowed_impact
        ):

            analysis["medical_access_impact"] = "low"


        # ====================================================
        # ADD USER CONTEXT
        # ====================================================

        analysis["location"] = location

        analysis["user_description"] = description


        # ====================================================
        # FINAL LOG
        # ====================================================

        print("\n" + "=" * 60)
        print("✅ DISASTER VISION ANALYSIS COMPLETE")
        print("=" * 60)

        print(
            f"🚨 Type: "
            f"{analysis['disaster_type']}"
        )

        print(
            f"⚠️ Severity: "
            f"{analysis['severity']}/10"
        )

        print(
            f"🎯 Confidence: "
            f"{analysis['confidence']}"
        )

        print(
            f"🚑 Evacuation: "
            f"{analysis['evacuation_required']}"
        )

        print("=" * 60)


        return analysis


    except Exception as e:

        print(
            "\n❌ VISION ANALYSIS ERROR:"
        )

        print(e)

        raise

