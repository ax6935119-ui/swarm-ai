from io import BytesIO

from PIL import Image, UnidentifiedImageError


# ============================================================
# CONFIGURATION
# ============================================================

MAX_IMAGE_SIZE = 10 * 1024 * 1024

ALLOWED_IMAGE_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}


# ============================================================
# VALIDATE SINGLE IMAGE
# ============================================================

def validate_image(
    image_bytes: bytes,
    content_type: str,
    filename: str = "unknown"
):
    """
    Perform fast local validation before sending
    the image to the AI Vision model.

    Returns:
        {
            "valid": bool,
            "error": str | None,
            "filename": str,
            "size": int,
            "content_type": str
        }
    """

    result = {

        "valid": False,

        "error": None,

        "filename": filename,

        "size": len(image_bytes) if image_bytes else 0,

        "content_type": content_type

    }

    # ========================================================
    # EMPTY IMAGE
    # ========================================================

    if not image_bytes:

        result["error"] = (
            "Uploaded image is empty."
        )

        return result

    # ========================================================
    # FILE SIZE
    # ========================================================

    if len(image_bytes) > MAX_IMAGE_SIZE:

        result["error"] = (
            "Image must be smaller than 10 MB."
        )

        return result

    # ========================================================
    # CONTENT TYPE
    # ========================================================

    if not content_type:

        result["error"] = (
            "Unable to determine image type."
        )

        return result

    content_type = (
        content_type
        .lower()
        .strip()
    )

    if content_type not in ALLOWED_IMAGE_TYPES:

        result["error"] = (
            "Unsupported image type. "
            "Please upload JPG, JPEG, PNG, or WEBP."
        )

        return result

    # ========================================================
    # IMAGE INTEGRITY CHECK
    # ========================================================

    try:

        image = Image.open(
            BytesIO(image_bytes)
        )

        image.verify()

    except (
        UnidentifiedImageError,
        OSError,
        ValueError
    ) as e:

        print(
            f"❌ Invalid image "
            f"'{filename}':",
            e
        )

        result["error"] = (
            "Uploaded file is corrupted "
            "or is not a valid image."
        )

        return result

    # ========================================================
    # SUCCESS
    # ========================================================

    result["valid"] = True

    return result


# ============================================================
# VALIDATE MULTIPLE IMAGES
# ============================================================

def validate_images(
    images
):
    """
    Validate multiple uploaded images.

    Input format:

        [
            {
                "filename": "...",
                "content_type": "...",
                "image_bytes": b"..."
            }
        ]

    Returns:

        {
            "valid": bool,
            "results": [...],
            "errors": [...]
        }
    """

    validation_results = []

    errors = []

    for image in images:

        result = validate_image(

            image_bytes=image.get(
                "image_bytes",
                b""
            ),

            content_type=image.get(
                "content_type"
            ),

            filename=image.get(
                "filename",
                "unknown"
            )

        )

        validation_results.append(
            result
        )

        if not result["valid"]:

            errors.append({

                "filename":
                    result["filename"],

                "error":
                    result["error"]

            })

    return {

        "valid":
            len(errors) == 0,

        "results":
            validation_results,

        "errors":
            errors

    }