import io
import asyncio
import threading
import os

from PIL import Image

import torch

from transformers import AutoModel, AutoProcessor


# ============================================================
# MODEL CONFIGURATION
# ============================================================

MODEL_NAME = os.getenv(
    "VISION_MODEL_NAME",
    "google/siglip-base-patch16-224"
)


DEVICE = (
    "cuda"
    if torch.cuda.is_available()
    else "cpu"
)


# ============================================================
# MODEL CACHE
# ============================================================

_model = None

_processor = None

_model_lock = threading.Lock()


# ============================================================
# DISASTER LABELS
# ============================================================

DISASTER_LABELS = [

    "a flooded urban road",

    "a forest wildfire",

    "an urban building fire",

    "a road accident",

    "a vehicle crash",

    "a collapsed building",

    "structural damage",

    "an earthquake damaged area",

    "a landslide disaster",

    "a coastal high tide flood",

    "a severe storm emergency",

    "an extreme weather disaster",

    "damaged infrastructure",

    "a blocked damaged road",

    "an emergency rescue operation",

    "a natural disaster scene",

]


# ============================================================
# NON-DISASTER LABELS
# ============================================================

NON_DISASTER_LABELS = [

    "a normal selfie",

    "a portrait photograph",

    "a person posing",

    "food",

    "a meal",

    "a meme",

    "a funny internet image",

    "a document",

    "paper",

    "a computer screenshot",

    "a phone screenshot",

    "a normal indoor room",

    "a product photograph",

    "an unrelated object",

    "a normal landscape",

    "a normal everyday photograph",

]


# ============================================================
# LOAD MODEL
# ============================================================

def get_model():

    global _model

    global _processor


    if (
        _model is not None
        and
        _processor is not None
    ):

        return (
            _model,
            _processor,
        )


    with _model_lock:

        if (
            _model is None
            or
            _processor is None
        ):

            print("\n")

            print("=" * 70)

            print(
                "🧠 LOADING CLIP IMAGE VALIDATION MODEL"
            )

            print(
                f"📦 Model: {MODEL_NAME}"
            )

            print(
                f"💻 Device: {DEVICE}"
            )

            print("=" * 70)


            _processor = (
                AutoProcessor.from_pretrained(
                    MODEL_NAME
                )
            )


            _model = (
                AutoModel.from_pretrained(
                    MODEL_NAME
                )
            )


            _model.to(
                DEVICE
            )


            _model.eval()


            print(
                "✅ IMAGE VALIDATION MODEL READY"
            )


    return (
        _model,
        _processor,
    )


# ============================================================
# LOAD IMAGE
# ============================================================

def load_image(
    image_bytes: bytes
):

    try:

        image = Image.open(
            io.BytesIO(
                image_bytes
            )
        )


        image.verify()


        image = Image.open(
            io.BytesIO(
                image_bytes
            )
        )


        return image.convert(
            "RGB"
        )


    except Exception as error:

        print(
            "❌ INVALID IMAGE:",
            error
        )


        raise ValueError(
            "Unable to decode uploaded image."
        )


# ============================================================
# CLASSIFY IMAGE
# ============================================================

def classify_image(
    image_bytes: bytes
):

    model, processor = (
        get_model()
    )


    image = load_image(
        image_bytes
    )


    labels = (

        DISASTER_LABELS

        +

        NON_DISASTER_LABELS

    )


    inputs = processor(

        text=labels,

        images=image,

        return_tensors="pt",

        padding="max_length",

    )


    inputs = {

        key:
        value.to(DEVICE)

        for key, value in
        inputs.items()

    }


    with torch.no_grad():

        outputs = model(
            **inputs
        )


    probabilities = torch.sigmoid(
        outputs.logits_per_image
    )[0].cpu().tolist()


    # ========================================================
    # SPLIT SCORES
    # ========================================================

    disaster_probabilities = (
        probabilities[
            :len(DISASTER_LABELS)
        ]
    )


    non_disaster_probabilities = (
        probabilities[
            len(DISASTER_LABELS):
        ]
    )


    # ========================================================
    # GROUP SCORES
    # ========================================================

    disaster_group_score = sum(
        disaster_probabilities
    )


    non_disaster_group_score = sum(
        non_disaster_probabilities
    )


    # ========================================================
    # BEST LABEL
    # ========================================================

    best_disaster_index = max(

        range(
            len(
                disaster_probabilities
            )
        ),

        key=lambda index:
            disaster_probabilities[index]

    )


    best_non_disaster_index = max(

        range(
            len(
                non_disaster_probabilities
            )
        ),

        key=lambda index:
            non_disaster_probabilities[index]

    )


    disaster_label = (
        DISASTER_LABELS[
            best_disaster_index
        ]
    )


    non_disaster_label = (
        NON_DISASTER_LABELS[
            best_non_disaster_index
        ]
    )


    strongest_disaster_score = (
        disaster_probabilities[
            best_disaster_index
        ]
    )


    strongest_non_disaster_score = (
        non_disaster_probabilities[
            best_non_disaster_index
        ]
    )


    # ========================================================
    # FINAL DECISION
    # ========================================================

    is_relevant = (
        strongest_disaster_score >= 0.35
        and strongest_disaster_score > strongest_non_disaster_score
    )


    # ========================================================
    # CONFIDENCE
    # ========================================================

    total = (

        disaster_group_score

        +

        non_disaster_group_score

    )


    if total > 0:

        confidence = (

            max(

                disaster_group_score,

                non_disaster_group_score,

            )

            /

            total

        )

    else:

        confidence = 0.0


    confidence = round(
        float(confidence),
        3
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    if is_relevant:

        predicted_label = (
            disaster_label
        )


        reason = (

            f"Image appears related to "
            f"{disaster_label}."

        )

    else:

        predicted_label = (
            non_disaster_label
        )


        reason = (

            f"Image appears more likely to contain "
            f"{non_disaster_label}."

        )


    return {

        "relevant":
            bool(
                is_relevant
            ),

        "confidence":
            confidence,

        "disaster_score":
            round(
                float(
                    disaster_group_score
                ),
                4
            ),

        "non_disaster_score":
            round(
                float(
                    non_disaster_group_score
                ),
                4
            ),

        "strongest_disaster_score":
            round(
                float(
                    strongest_disaster_score
                ),
                4
            ),

        "strongest_non_disaster_score":
            round(
                float(
                    strongest_non_disaster_score
                ),
                4
            ),

        "predicted_label":
            predicted_label,

        "reason":
            reason,

    }


# ============================================================
# VALIDATE MULTIPLE IMAGES
# ============================================================

async def validate_disaster_images(
    images: list
):

    print("\n")

    print("=" * 70)

    print(
        "🔍 STARTING IMAGE VALIDATION"
    )

    print("=" * 70)


    if not images:

        return {

            "valid_images":
                [],

            "rejected_images":
                [],

        }


    valid_images = []

    rejected_images = []


    for index, image_data in enumerate(
        images,
        start=1
    ):

        image_index = (
            image_data.get(
                "image_index",
                index
            )
        )


        filename = (
            image_data.get(
                "filename",
                f"image_{image_index}"
            )
        )


        image_bytes = (
            image_data.get(
                "image_bytes"
            )
        )


        print(
            f"\n🔎 VALIDATING IMAGE "
            f"{image_index}: "
            f"{filename}"
        )


        if not image_bytes:

            rejected_images.append({

                "image_index":
                    image_index,

                "filename":
                    filename,

                "reason":
                    "Image contains no data.",

                "confidence":
                    0.0,

            })

            continue


        try:

            result = (
                await asyncio.to_thread(

                    classify_image,

                    image_bytes,

                )
            )


        except Exception as error:

            print(
                "❌ CLASSIFICATION ERROR:",
                error
            )


            rejected_images.append({

                "image_index":
                    image_index,

                "filename":
                    filename,

                "reason":
                    "Unable to validate image.",

                "confidence":
                    0.0,

            })

            continue


        print(
            f"🏷️ Prediction: "
            f"{result['predicted_label']}"
        )


        print(
            f"🚨 Disaster Score: "
            f"{result['disaster_score']}"
        )


        print(
            f"🚫 Non-Disaster Score: "
            f"{result['non_disaster_score']}"
        )


        # ========================================================
        # ACCEPT
        # ========================================================

        if result["relevant"]:

            print(
                "✅ IMAGE ACCEPTED"
            )


            valid_image = {

                **image_data,

                "validation":
                    result,

            }


            valid_images.append(
                valid_image
            )


        # ========================================================
        # REJECT
        # ========================================================

        else:

            print(
                "❌ IMAGE REJECTED"
            )


            rejected_images.append({

                "image_index":
                    image_index,

                "filename":
                    filename,

                "reason":
                    result["reason"],

                "confidence":
                    result["confidence"],

                "predicted_label":
                    result["predicted_label"],

                "disaster_score":
                    result["disaster_score"],

                "non_disaster_score":
                    result["non_disaster_score"],

            })


    print("\n")

    print("=" * 70)

    print(
        "🔍 IMAGE VALIDATION COMPLETE"
    )

    print(
        f"📷 Total: {len(images)}"
    )

    print(
        f"✅ Accepted: {len(valid_images)}"
    )

    print(
        f"❌ Rejected: {len(rejected_images)}"
    )

    print("=" * 70)


    return {

        "valid_images":
            valid_images,

        "rejected_images":
            rejected_images,

    }