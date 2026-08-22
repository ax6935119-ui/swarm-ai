import os
import io
import json
import re
import base64

from dotenv import load_dotenv

from groq import Groq


# ============================================================
# LOAD ENVIRONMENT
# ============================================================

load_dotenv()


# ============================================================
# GROQ CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv(
    "GROQ_API_KEY"
)


if not GROQ_API_KEY:

    raise RuntimeError(
        "GROQ_API_KEY is missing."
    )


# ============================================================
# MODEL
# ============================================================

MODEL_NAME = os.getenv(
    "GROQ_MODEL",
    "qwen/qwen3.6-27b"
)


# ============================================================
# GROQ CLIENT
# ============================================================

client = Groq(
    api_key=GROQ_API_KEY
)


# ============================================================
# DEFAULT ANALYSIS
# ============================================================

def get_default_analysis():

    return {

        "disaster_relevant":
            False,

        "disaster_type":
            "Unknown Disaster",

        "severity":
            0,

        "confidence":
            0.0,

        "observations":
            [],

        "hazards":
            [],

        "infrastructure_damage":
            [],

        "evacuation_required":
            False,

        "victim_estimate":
            0,

        "traffic_impact":
            "low",

        "medical_access_impact":
            "low",

        "summary":
            "",

        "image_validation":
            []

    }


# ============================================================
# REMOVE THINKING
# ============================================================

def remove_thinking(
    text: str
):

    if not text:

        return ""


    # Remove complete think blocks

    cleaned = re.sub(

        r"<think>.*?</think>",

        "",

        text,

        flags=re.DOTALL | re.IGNORECASE

    )


    # Sometimes model starts <think> but never closes it.
    # If JSON appears later, remove everything before JSON.

    if "<think>" in cleaned.lower():

        first_brace = cleaned.find("{")

        if first_brace != -1:

            cleaned = cleaned[
                first_brace:
            ]


    return cleaned.strip()


# ============================================================
# EXTRACT MARKDOWN JSON
# ============================================================

def extract_markdown_json(
    text: str
):

    patterns = [

        r"```json\s*(\{.*?\})\s*```",

        r"```\s*(\{.*?\})\s*```"

    ]


    for pattern in patterns:

        matches = re.findall(

            pattern,

            text,

            flags=re.DOTALL | re.IGNORECASE

        )


        if matches:

            # Try from last to first.
            # Usually the final block is the final answer.

            for match in reversed(matches):

                try:

                    return json.loads(
                        match.strip()
                    )

                except Exception:

                    continue


    return None


# ============================================================
# EXTRACT BALANCED JSON OBJECT
# ============================================================

def extract_balanced_json(
    text: str
):

    start_positions = [

        index

        for index, character in enumerate(text)

        if character == "{"

    ]


    # Try every possible opening brace.
    # The last valid full JSON object is generally
    # the actual model answer.

    valid_objects = []


    for start in start_positions:

        depth = 0

        in_string = False

        escape = False


        for index in range(
            start,
            len(text)
        ):

            character = text[index]


            # -----------------------------------------------
            # STRING HANDLING
            # -----------------------------------------------

            if in_string:

                if escape:

                    escape = False

                    continue


                if character == "\\":

                    escape = True

                    continue


                if character == '"':

                    in_string = False


                continue


            # -----------------------------------------------
            # START STRING
            # -----------------------------------------------

            if character == '"':

                in_string = True

                continue


            # -----------------------------------------------
            # OPEN OBJECT
            # -----------------------------------------------

            if character == "{":

                depth += 1


            # -----------------------------------------------
            # CLOSE OBJECT
            # -----------------------------------------------

            elif character == "}":

                depth -= 1


                if depth == 0:

                    candidate = text[
                        start:index + 1
                    ]


                    try:

                        parsed = json.loads(
                            candidate
                        )

                        if isinstance(
                            parsed,
                            dict
                        ):

                            valid_objects.append(
                                parsed
                            )

                    except Exception:

                        pass


                    break


    # --------------------------------------------------------
    # SELECT BEST JSON OBJECT
    # --------------------------------------------------------

    if not valid_objects:

        return None


    # Prefer an object containing disaster_relevant

    for obj in reversed(
        valid_objects
    ):

        if "disaster_relevant" in obj:

            return obj


    return valid_objects[-1]


# ============================================================
# CLEAN JSON RESPONSE
# ============================================================

def extract_json_from_response(
    response_text: str
):

    print("\n")

    print("=" * 70)

    print(
        "🔍 EXTRACTING JSON FROM AI RESPONSE"
    )

    print("=" * 70)


    if not response_text:

        raise ValueError(
            "AI returned an empty response."
        )


    # ========================================================
    # STEP 1: REMOVE THINKING
    # ========================================================

    cleaned_text = remove_thinking(
        response_text
    )


    # ========================================================
    # STEP 2: DIRECT JSON
    # ========================================================

    try:

        parsed = json.loads(
            cleaned_text
        )


        if isinstance(
            parsed,
            dict
        ):

            print(
                "✅ DIRECT JSON OBJECT PARSED"
            )

            return parsed

    except Exception:

        pass


    # ========================================================
    # STEP 3: MARKDOWN JSON BLOCK
    # ========================================================

    parsed = extract_markdown_json(
        cleaned_text
    )


    if parsed:

        print(
            "✅ JSON OBJECT EXTRACTED FROM MARKDOWN BLOCK"
        )

        return parsed


    # ========================================================
    # STEP 4: BALANCED JSON EXTRACTION
    # ========================================================

    parsed = extract_balanced_json(
        cleaned_text
    )


    if parsed:

        print(
            "✅ JSON OBJECT EXTRACTED USING BALANCED BRACES"
        )

        return parsed


    # ========================================================
    # STEP 5: RAW RESPONSE DEBUG
    # ========================================================

    print(
        "❌ FAILED TO EXTRACT JSON"
    )

    print(
        "\nRAW RESPONSE:"
    )

    print(
        response_text
    )


    raise ValueError(
        "AI returned invalid JSON."
    )


# ============================================================
# SAFE LIST
# ============================================================

def ensure_list(
    value
):

    if value is None:

        return []


    if isinstance(
        value,
        list
    ):

        return value


    if isinstance(
        value,
        str
    ):

        return [
            value
        ]


    return []


# ============================================================
# NORMALIZE BOOLEAN
# ============================================================

def normalize_boolean(
    value,
    default=False
):

    if isinstance(
        value,
        bool
    ):

        return value


    if isinstance(
        value,
        str
    ):

        value = value.lower().strip()


        if value in [
            "true",
            "yes",
            "1"
        ]:

            return True


        if value in [
            "false",
            "no",
            "0"
        ]:

            return False


    return default


# ============================================================
# NORMALIZE NUMBER
# ============================================================

def normalize_float(
    value,
    default=0.0
):

    try:

        return float(
            value
        )

    except Exception:

        return default


# ============================================================
# NORMALIZE INTEGER
# ============================================================

def normalize_int(
    value,
    default=0
):

    try:

        return int(
            float(value)
        )

    except Exception:

        return default


# ============================================================
# NORMALIZE ANALYSIS
# ============================================================

def normalize_analysis(
    analysis,
    image_count
):

    default = get_default_analysis()


    if not isinstance(
        analysis,
        dict
    ):

        raise ValueError(
            "Parsed AI response is not a JSON object."
        )


    # ========================================================
    # REQUIRED FIELD DEBUG
    # ========================================================

    print(
        "\n🔎 PARSED AI KEYS:"
    )

    print(
        list(
            analysis.keys()
        )
    )


    # ========================================================
    # DISASTER RELEVANCE
    # ========================================================

    disaster_relevant = normalize_boolean(

        analysis.get(
            "disaster_relevant"
        ),

        False

    )


    # ========================================================
    # DISASTER TYPE
    # ========================================================

    disaster_type = analysis.get(

        "disaster_type",

        default[
            "disaster_type"
        ]

    )


    if not isinstance(
        disaster_type,
        str
    ):

        disaster_type = str(
            disaster_type
        )


    # ========================================================
    # SEVERITY
    # ========================================================

    severity = normalize_int(

        analysis.get(
            "severity"
        ),

        0

    )


    severity = max(
        0,
        min(
            severity,
            10
        )
    )


    # ========================================================
    # CONFIDENCE
    # ========================================================

    confidence = normalize_float(

        analysis.get(
            "confidence"
        ),

        0.0

    )


    confidence = max(
        0.0,
        min(
            confidence,
            1.0
        )
    )


    # ========================================================
    # IMAGE VALIDATION
    # ========================================================

    image_validation = ensure_list(

        analysis.get(
            "image_validation"
        )

    )


    # If model forgot image validation,
    # create one result for every valid image.

    if not image_validation:

        image_validation = []


        for image_index in range(

            1,

            image_count + 1

        ):

            image_validation.append({

                "image_index":
                    image_index,

                "relevant":
                    disaster_relevant,

                "reason":

                    "Image included in AI disaster analysis."

            })


    # ========================================================
    # NORMALIZED RESULT
    # ========================================================

    normalized = {

        "disaster_relevant":
            disaster_relevant,

        "disaster_type":
            disaster_type,

        "severity":
            severity,

        "confidence":
            confidence,

        "observations":

            ensure_list(

                analysis.get(
                    "observations"
                )

            ),

        "hazards":

            ensure_list(

                analysis.get(
                    "hazards"
                )

            ),

        "infrastructure_damage":

            ensure_list(

                analysis.get(
                    "infrastructure_damage"
                )

            ),

        "evacuation_required":

            normalize_boolean(

                analysis.get(
                    "evacuation_required"
                ),

                False

            ),

        "victim_estimate":

            normalize_int(

                analysis.get(
                    "victim_estimate"
                ),

                0

            ),

        "traffic_impact":

            str(

                analysis.get(

                    "traffic_impact",

                    "low"

                )

            ).lower(),

        "medical_access_impact":

            str(

                analysis.get(

                    "medical_access_impact",

                    "low"

                )

            ).lower(),

        "summary":

            str(

                analysis.get(

                    "summary",

                    ""

                )

            ),

        "image_validation":
            image_validation

    }


    return normalized


# ============================================================
# CONVERT IMAGE TO BASE64
# ============================================================

def image_to_base64(
    image_bytes: bytes,
    content_type: str
):

    encoded = base64.b64encode(

        image_bytes

    ).decode(
        "utf-8"
    )


    return (

        f"data:{content_type};base64,{encoded}"

    )


# ============================================================
# BUILD IMAGE CONTENT
# ============================================================

def build_image_content(
    images
):

    content = []


    for image in images:

        image_bytes = image.get(
            "image_bytes"
        )


        content_type = image.get(

            "content_type",

            "image/jpeg"

        )


        if not image_bytes:

            continue


        image_url = image_to_base64(

            image_bytes,

            content_type

        )


        content.append({

            "type":
                "image_url",

            "image_url": {

                "url":
                    image_url

            }

        })


    return content


# ============================================================
# DISASTER ANALYSIS PROMPT
# ============================================================

def build_analysis_prompt(

    location: str,

    description: str,

    image_count: int

):

    return f"""
You are an emergency disaster assessment AI.

Analyze the uploaded disaster image or images.

LOCATION:
{location}

DESCRIPTION:
{description if description else "No additional description provided."}

NUMBER OF UPLOADED IMAGES:
{image_count}

IMPORTANT INSTRUCTIONS:

1. Analyze the actual visible content of the images.
2. Do not invent casualties, destruction, or events that are not visible.
3. If the images show a disaster, emergency, accident, flooding, fire, collapse,
   landslide, severe weather, dangerous infrastructure damage, or another
   emergency situation, set disaster_relevant to true.
4. If the image clearly does not depict a disaster or emergency,
   set disaster_relevant to false.
5. Severity must be an integer from 0 to 10.
6. Confidence must be between 0 and 1.
7. traffic_impact must be one of:
   low, medium, high
8. medical_access_impact must be one of:
   low, medium, high
9. image_validation must contain one object for every uploaded image.
10. Return ONLY a valid JSON object.
11. DO NOT include reasoning.
12. DO NOT use <think> tags.
13. DO NOT use markdown code blocks.

Return exactly this structure:

{{
    "disaster_relevant": true,
    "disaster_type": "Flood",
    "severity": 7,
    "confidence": 0.95,
    "observations": [
        "Observation"
    ],
    "hazards": [
        "Hazard"
    ],
    "infrastructure_damage": [
        "Damage"
    ],
    "evacuation_required": false,
    "victim_estimate": 0,
    "traffic_impact": "high",
    "medical_access_impact": "medium",
    "summary": "Short emergency assessment summary.",
    "image_validation": [
        {{
            "image_index": 1,
            "relevant": true,
            "reason": "Reason"
        }}
    ]
}}
"""


# ============================================================
# ANALYZE DISASTER IMAGE
# ============================================================

async def analyze_disaster_image(

    images: list,

    location: str,

    description: str = ""

):

    print("\n")

    print("=" * 70)

    print(
        "🧠 STARTING MULTI-IMAGE DISASTER ANALYSIS"
    )

    print("=" * 70)

    print(
        f"📷 Images received: "
        f"{len(images)}"
    )

    print(
        f"📍 Location: "
        f"{location}"
    )


    if not images:

        raise ValueError(
            "No images were provided for analysis."
        )


    # ========================================================
    # BUILD PROMPT
    # ========================================================

    prompt = build_analysis_prompt(

        location=location,

        description=description,

        image_count=len(images)

    )


    # ========================================================
    # BUILD MULTIMODAL MESSAGE
    # ========================================================

    image_content = build_image_content(

        images
    )


    if not image_content:

        raise ValueError(
            "No valid image data available."
        )


    message_content = [

        {

            "type":
                "text",

            "text":
                prompt

        }

    ] + image_content


    # ========================================================
    # GROQ REQUEST
    # ========================================================

    print(
        f"\n🤖 Using Groq model: "
        f"{MODEL_NAME}"
    )


    try:

        completion = client.chat.completions.create(

            model=MODEL_NAME,

            messages=[

                {

                    "role":
                        "user",

                    "content":
                        message_content

                }

            ],

            temperature=0.1,

            max_completion_tokens=2000

        )


        response_text = (

            completion
            .choices[0]
            .message
            .content

        )


        print(
            "\n🤖 RAW GROQ RESPONSE:\n"
        )

        print(
            response_text
        )


    except Exception as e:

        print(
            "\n❌ GROQ ANALYSIS ERROR:",
            e
        )

        raise


    # ========================================================
    # EXTRACT JSON
    # ========================================================

    try:

        parsed_analysis = (

            extract_json_from_response(

                response_text

            )

        )


    except Exception as e:

        print(
            "\n❌ JSON EXTRACTION ERROR:"
        )

        print(
            e
        )

        raise ValueError(
            "AI returned invalid JSON."
        )


    # ========================================================
    # NORMALIZE RESULT
    # ========================================================

    analysis = normalize_analysis(

        parsed_analysis,

        len(images)

    )


    # ========================================================
    # IMPORTANT DEBUG
    # ========================================================

    print(
        "\n🧠 NORMALIZED DISASTER ANALYSIS:"
    )

    print(

        json.dumps(

            analysis,

            indent=2,

            default=str

        )

    )


    # ========================================================
    # SUCCESS
    # ========================================================

    print("\n")

    print("=" * 70)

    print(
        "✅ DISASTER ANALYSIS SUCCESSFUL"
    )

    print("=" * 70)


    return analysis