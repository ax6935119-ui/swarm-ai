import os
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

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

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
        "disaster_relevant": False,
        "disaster_type": "Unknown Disaster",
        "severity": 0,
        "confidence": 0.0,
        "observations": [],
        "hazards": [],
        "infrastructure_damage": [],
        "evacuation_required": False,
        "victim_estimate": 0,
        "traffic_impact": "low",
        "medical_access_impact": "low",
        "summary": "",
        "image_validation": []
    }


# ============================================================
# REMOVE THINKING
# ============================================================

def remove_thinking(text: str):

    if not text:
        return ""

    cleaned = text.strip()

    # --------------------------------------------------------
    # REMOVE COMPLETE <think>...</think> BLOCKS
    # --------------------------------------------------------

    cleaned = re.sub(
        r"<think>.*?</think>",
        "",
        cleaned,
        flags=re.DOTALL | re.IGNORECASE
    )

    # --------------------------------------------------------
    # HANDLE UNCLOSED <think> BLOCK
    #
    # If JSON exists after reasoning, keep JSON.
    # --------------------------------------------------------

    if "<think>" in cleaned.lower():

        first_brace = cleaned.find("{")

        if first_brace != -1:

            cleaned = cleaned[first_brace:]

        else:

            # The model got truncated while reasoning.
            raise ValueError(
                "AI response was truncated inside "
                "the reasoning block before JSON was generated."
            )

    return cleaned.strip()


# ============================================================
# REMOVE MARKDOWN
# ============================================================

def remove_markdown(text: str):

    if not text:
        return ""

    cleaned = text.strip()

    cleaned = re.sub(
        r"^```json",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"^```",
        "",
        cleaned
    )

    cleaned = re.sub(
        r"```$",
        "",
        cleaned
    )

    return cleaned.strip()


# ============================================================
# EXTRACT BALANCED JSON
# ============================================================

def extract_balanced_json(text: str):

    if not text:
        return None

    start = text.find("{")

    if start == -1:
        return None

    depth = 0
    in_string = False
    escape = False

    for index in range(start, len(text)):

        char = text[index]

        # ----------------------------------------------------
        # HANDLE ESCAPED CHARACTERS
        # ----------------------------------------------------

        if escape:
            escape = False
            continue

        if char == "\\":
            escape = True
            continue

        # ----------------------------------------------------
        # HANDLE JSON STRINGS
        # ----------------------------------------------------

        if char == '"':
            in_string = not in_string
            continue

        if in_string:
            continue

        # ----------------------------------------------------
        # OPEN OBJECT
        # ----------------------------------------------------

        if char == "{":
            depth += 1

        # ----------------------------------------------------
        # CLOSE OBJECT
        # ----------------------------------------------------

        elif char == "}":

            depth -= 1

            if depth == 0:

                candidate = text[start:index + 1]

                try:

                    parsed = json.loads(candidate)

                    if isinstance(parsed, dict):
                        return parsed

                except json.JSONDecodeError:
                    return None

    return None


# ============================================================
# EXTRACT JSON FROM RESPONSE
# ============================================================

def extract_json_from_response(response_text: str):

    print("\n")
    print("=" * 70)
    print("🔍 EXTRACTING JSON FROM AI RESPONSE")
    print("=" * 70)

    if not response_text:

        raise ValueError(
            "AI returned an empty response."
        )

    # ========================================================
    # RAW RESPONSE DEBUG
    # ========================================================

    print("\n📥 RAW RESPONSE:")
    print(response_text[:5000])

    # ========================================================
    # STEP 1: REMOVE THINKING
    # ========================================================

    cleaned_text = remove_thinking(
        response_text
    )

    # ========================================================
    # STEP 2: REMOVE MARKDOWN
    # ========================================================

    cleaned_text = remove_markdown(
        cleaned_text
    )

    print("\n🧹 CLEANED RESPONSE:")
    print(cleaned_text[:5000])

    # ========================================================
    # STEP 3: DIRECT JSON
    # ========================================================

    try:

        parsed = json.loads(
            cleaned_text
        )

        if isinstance(parsed, dict):

            print(
                "\n✅ DIRECT JSON PARSED SUCCESSFULLY"
            )

            return parsed

    except json.JSONDecodeError:
        pass

    # ========================================================
    # STEP 4: BALANCED JSON EXTRACTION
    # ========================================================

    parsed = extract_balanced_json(
        cleaned_text
    )

    if parsed:

        print(
            "\n✅ BALANCED JSON EXTRACTED SUCCESSFULLY"
        )

        return parsed

    # ========================================================
    # FAILURE
    # ========================================================

    print("\n❌ FAILED TO EXTRACT JSON")

    raise ValueError(
        "AI returned incomplete or invalid JSON."
    )


# ============================================================
# SAFE LIST
# ============================================================

def ensure_list(value):

    if value is None:
        return []

    if isinstance(value, list):
        return value

    if isinstance(value, str):
        return [value]

    return []


# ============================================================
# NORMALIZE BOOLEAN
# ============================================================

def normalize_boolean(
    value,
    default=False
):

    if isinstance(value, bool):
        return value

    if isinstance(value, str):

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
# NORMALIZE FLOAT
# ============================================================

def normalize_float(
    value,
    default=0.0
):

    try:
        return float(value)

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

    if not isinstance(analysis, dict):

        raise ValueError(
            "Parsed AI response is not a JSON object."
        )

    print("\n🔎 PARSED AI KEYS:")
    print(
        list(analysis.keys())
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
        default["disaster_type"]
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
        analysis.get("severity"),
        0
    )

    severity = max(
        0,
        min(severity, 10)
    )

    # ========================================================
    # CONFIDENCE
    # ========================================================

    confidence = normalize_float(
        analysis.get("confidence"),
        0.0
    )

    confidence = max(
        0.0,
        min(confidence, 1.0)
    )

    # ========================================================
    # IMAGE VALIDATION
    # ========================================================

    image_validation = ensure_list(
        analysis.get(
            "image_validation"
        )
    )

    # --------------------------------------------------------
    # ENSURE EXACTLY ONE VALIDATION OBJECT
    # FOR EACH UPLOADED IMAGE
    # --------------------------------------------------------

    normalized_validation = []

    for image_index in range(
        1,
        image_count + 1
    ):

        existing = next(
            (
                item
                for item in image_validation
                if isinstance(item, dict)
                and normalize_int(
                    item.get("image_index"),
                    -1
                ) == image_index
            ),
            None
        )

        if existing:

            normalized_validation.append({
                "image_index": image_index,
                "relevant": normalize_boolean(
                    existing.get("relevant"),
                    disaster_relevant
                ),
                "reason": str(
                    existing.get(
                        "reason",
                        "Image included in AI disaster analysis."
                    )
                )
            })

        else:

            normalized_validation.append({
                "image_index": image_index,
                "relevant": disaster_relevant,
                "reason":
                    "Image included in AI disaster analysis."
            })

    # ========================================================
    # VALIDATE IMPACT VALUES
    # ========================================================

    traffic_impact = str(
        analysis.get(
            "traffic_impact",
            "low"
        )
    ).lower().strip()

    if traffic_impact not in [
        "low",
        "medium",
        "high"
    ]:
        traffic_impact = "low"

    medical_access_impact = str(
        analysis.get(
            "medical_access_impact",
            "low"
        )
    ).lower().strip()

    if medical_access_impact not in [
        "low",
        "medium",
        "high"
    ]:
        medical_access_impact = "low"

    # ========================================================
    # FINAL NORMALIZED RESULT
    # ========================================================

    return {

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
            max(
                0,
                normalize_int(
                    analysis.get(
                        "victim_estimate"
                    ),
                    0
                )
            ),

        "traffic_impact":
            traffic_impact,

        "medical_access_impact":
            medical_access_impact,

        "summary":
            str(
                analysis.get(
                    "summary",
                    ""
                )
            ),

        "image_validation":
            normalized_validation
    }


# ============================================================
# CONVERT IMAGE TO BASE64
# ============================================================

def image_to_base64(
    image_bytes: bytes,
    content_type: str
):

    encoded = base64.b64encode(
        image_bytes
    ).decode("utf-8")

    return (
        f"data:{content_type};base64,{encoded}"
    )


# ============================================================
# BUILD IMAGE CONTENT
# ============================================================

def build_image_content(images):

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
            "type": "image_url",
            "image_url": {
                "url": image_url
            }
        })

    return content


# ============================================================
# SYSTEM PROMPT
# ============================================================

SYSTEM_PROMPT = """
You are a disaster assessment AI API.

Your task is to analyze disaster images and return structured data.

CRITICAL OUTPUT RULES:

Return ONLY one valid JSON object.

DO NOT output:

- reasoning
- chain of thought
- analysis
- explanations
- <think> tags
- markdown
- code fences
- text before JSON
- text after JSON

The response must:

1. Start with {
2. End with }
3. Be valid JSON
4. Be directly parseable with Python json.loads()

Think internally if necessary, but never expose reasoning.
"""


# ============================================================
# DISASTER ANALYSIS PROMPT
# ============================================================

def build_analysis_prompt(
    location: str,
    description: str,
    image_count: int
):

    return f"""
Analyze the uploaded disaster image or images.

LOCATION:
{location}

DESCRIPTION:
{description if description else "No additional description provided."}

NUMBER OF UPLOADED IMAGES:
{image_count}

RULES:

1. Analyze only visible evidence in the images.

2. Do not invent casualties, deaths, destruction,
   or emergency events.

3. disaster_relevant must be true or false.

4. severity must be an integer from 0 to 10.

5. confidence must be a number from 0 to 1.

6. traffic_impact must be:
   "low", "medium", or "high".

7. medical_access_impact must be:
   "low", "medium", or "high".

8. image_validation must contain exactly
   {image_count} object(s).

9. One image_validation object must exist
   for every image_index from 1 to {image_count}.

Return this exact JSON structure:

{{
    "disaster_relevant": true,
    "disaster_type": "Flood",
    "severity": 7,
    "confidence": 0.95,
    "observations": [],
    "hazards": [],
    "infrastructure_damage": [],
    "evacuation_required": false,
    "victim_estimate": 0,
    "traffic_impact": "high",
    "medical_access_impact": "medium",
    "summary": "",
    "image_validation": [
        {{
            "image_index": 1,
            "relevant": true,
            "reason": ""
        }}
    ]
}}
"""


# ============================================================
# GROQ ANALYSIS REQUEST
# ============================================================

def generate_ai_analysis(
    message_content
):

    completion = client.chat.completions.create(

        model=MODEL_NAME,

        messages=[

            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },

            {
                "role": "user",
                "content": message_content
            }

        ],

        temperature=0,

        # JSON MODE
        response_format={
            "type": "json_object"
        },

        # Increase enough to prevent truncation
        max_completion_tokens=4000
    )

    response_text = (
        completion
        .choices[0]
        .message
        .content
    )

    return response_text


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
        f"📷 Images received: {len(images)}"
    )

    print(
        f"📍 Location: {location}"
    )

    # ========================================================
    # VALIDATE IMAGES
    # ========================================================

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
    # BUILD IMAGE CONTENT
    # ========================================================

    image_content = build_image_content(
        images
    )

    if not image_content:

        raise ValueError(
            "No valid image data available."
        )

    # ========================================================
    # CREATE MULTIMODAL CONTENT
    # ========================================================

    message_content = [

        {
            "type": "text",
            "text": prompt
        }

    ] + image_content

    print(
        f"\n🤖 Using Groq model: {MODEL_NAME}"
    )

    # ========================================================
    # RETRY SYSTEM
    # ========================================================

    MAX_RETRIES = 2

    last_error = None

    for attempt in range(
        1,
        MAX_RETRIES + 2
    ):

        try:

            print("\n")
            print("=" * 70)

            print(
                f"🤖 AI ANALYSIS ATTEMPT "
                f"{attempt}/{MAX_RETRIES + 1}"
            )

            print("=" * 70)

            # =================================================
            # GROQ REQUEST
            # =================================================

            response_text = generate_ai_analysis(
                message_content
            )

            print(
                "\n🤖 RAW GROQ RESPONSE:\n"
            )

            print(
                response_text
            )

            # =================================================
            # EXTRACT JSON
            # =================================================

            parsed_analysis = (
                extract_json_from_response(
                    response_text
                )
            )

            # =================================================
            # NORMALIZE
            # =================================================

            analysis = normalize_analysis(
                parsed_analysis,
                len(images)
            )

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

            print("\n")
            print("=" * 70)

            print(
                "✅ DISASTER ANALYSIS SUCCESSFUL"
            )

            print("=" * 70)

            return analysis

        except Exception as e:

            last_error = e

            print(
                f"\n⚠️ ANALYSIS ATTEMPT "
                f"{attempt} FAILED:"
            )

            print(e)

            if attempt <= MAX_RETRIES:

                print(
                    "\n🔄 RETRYING AI ANALYSIS..."
                )

    # ========================================================
    # ALL ATTEMPTS FAILED
    # ========================================================

    print(
        "\n❌ DISASTER AI ANALYSIS FAILED"
    )

    raise ValueError(
        f"AI analysis failed after "
        f"{MAX_RETRIES + 1} attempts. "
        f"Last error: {last_error}"
    )