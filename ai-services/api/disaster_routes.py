import uuid
import json
import urllib.parse
import urllib.request

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    Form,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
)

from services.disaster_analyzer import (
    analyze_disaster_image
)

from orchestrator.langgraph_orchestrator import (
    graph
)


router = APIRouter()


# ============================================================
# GEOCODING
# ============================================================

def geocode_location(location: str):

    try:

        print("\n🌍 GEOCODING LOCATION...")
        print(f"📍 Location: {location}")

        query = urllib.parse.urlencode({
            "q": location,
            "format": "json",
            "limit": 1
        })

        url = (
            "https://nominatim.openstreetmap.org/search?"
            + query
        )

        request = urllib.request.Request(
            url,
            headers={
                "User-Agent":
                    "SwarmAI-Disaster-System/1.0"
            }
        )

        with urllib.request.urlopen(
            request,
            timeout=10
        ) as response:

            data = json.loads(
                response.read().decode("utf-8")
            )

        if not data:

            print(
                "⚠️ Location could not be geocoded"
            )

            return None, None

        latitude = float(
            data[0]["lat"]
        )

        longitude = float(
            data[0]["lon"]
        )

        print(
            f"📍 Coordinates: "
            f"{latitude}, {longitude}"
        )

        return latitude, longitude

    except Exception as e:

        print(
            "⚠️ GEOCODING ERROR:",
            e
        )

        return None, None


# ============================================================
# WEBSOCKET CLIENT MANAGER
# ============================================================

connected_clients = set()


# ============================================================
# BROADCAST
# ============================================================

async def broadcast_disaster_data(data):

    if not connected_clients:

        print(
            "⚠️ No WebSocket clients connected"
        )

        return

    disconnected = set()

    print(
        f"📡 Broadcasting to "
        f"{len(connected_clients)} client(s)"
    )

    for websocket in connected_clients:

        try:

            await websocket.send_json(data)

            print(
                "✅ WebSocket payload sent"
            )

        except Exception as e:

            print(
                "❌ WebSocket broadcast error:",
                e
            )

            disconnected.add(
                websocket
            )

    for websocket in disconnected:

        connected_clients.discard(
            websocket
        )


# ============================================================
# WEBSOCKET
# ============================================================

@router.websocket("/ws/disaster")
async def disaster_websocket(
    websocket: WebSocket
):

    print(
        "\n🔌 Incoming WebSocket connection..."
    )

    print(
        f"🌐 Client: {websocket.client}"
    )

    try:

        # ----------------------------------------------------
        # ACCEPT CONNECTION
        # ----------------------------------------------------

        await websocket.accept()

        connected_clients.add(
            websocket
        )

        print(
            "✅ WebSocket CONNECTED"
        )

        print(
            f"👥 Connected clients: "
            f"{len(connected_clients)}"
        )

        # ----------------------------------------------------
        # SEND CONNECTION MESSAGE
        # ----------------------------------------------------

        await websocket.send_json({

            "type":
                "connection",

            "status":
                "connected",

            "message":
                "SwarmAI disaster monitoring connected."

        })

        # ----------------------------------------------------
        # KEEP CONNECTION ALIVE
        # ----------------------------------------------------

        while True:

            message = await websocket.receive_text()

            print(
                "📨 WebSocket message:",
                message
            )

    except WebSocketDisconnect:

        print(
            "🔌 WebSocket client disconnected"
        )

    except Exception as e:

        print(
            "❌ WebSocket ERROR:",
            e
        )

    finally:

        connected_clients.discard(
            websocket
        )

        print(
            f"👥 Connected clients: "
            f"{len(connected_clients)}"
        )


# ============================================================
# DISASTER ANALYSIS
# ============================================================

@router.post("/disaster/analyze")
async def analyze_disaster(

    location: str = Form(...),

    description: str = Form(""),

    image: UploadFile = File(...)

):

    print("\n")
    print("=" * 70)

    print(
        "🚨 NEW DISASTER INPUT RECEIVED"
    )

    print("=" * 70)

    # ========================================================
    # LOCATION
    # ========================================================

    location = location.strip()

    if not location:

        raise HTTPException(
            status_code=400,
            detail="Disaster location is required."
        )

    print(
        f"📍 Location: {location}"
    )

    # ========================================================
    # DESCRIPTION
    # ========================================================

    description = description.strip()

    print(
        f"📝 Description: {description}"
    )

    # ========================================================
    # IMAGE VALIDATION
    # ========================================================

    if image is None:

        raise HTTPException(
            status_code=400,
            detail="Disaster image is required."
        )

    print(
        f"📷 Image: {image.filename}"
    )

    print(
        f"📷 Content Type: "
        f"{image.content_type}"
    )

    if not image.content_type:

        raise HTTPException(
            status_code=400,
            detail="Unable to determine image type."
        )

    if not image.content_type.startswith("image/"):

        raise HTTPException(
            status_code=400,
            detail="Uploaded file must be an image."
        )

    # ========================================================
    # READ IMAGE
    # ========================================================

    try:

        image_bytes = await image.read()

    except Exception as e:

        print(
            "❌ IMAGE READ ERROR:",
            e
        )

        raise HTTPException(
            status_code=400,
            detail="Unable to read uploaded image."
        )

    print(
        f"📦 Image Size: "
        f"{len(image_bytes)} bytes"
    )

    # ========================================================
    # IMAGE SIZE
    # ========================================================

    max_size = 10 * 1024 * 1024

    if len(image_bytes) == 0:

        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty."
        )

    if len(image_bytes) > max_size:

        raise HTTPException(
            status_code=413,
            detail="Image must be smaller than 10 MB."
        )

    # ========================================================
    # AI ANALYSIS
    # ========================================================

    print("\n🧠 Sending image to Groq Vision...")

    try:

        analysis = await analyze_disaster_image(

            image_bytes=image_bytes,

            content_type=image.content_type,

            location=location,

            description=description

        )

    except Exception as e:

        print(
            "\n❌ DISASTER AI ANALYSIS FAILED"
        )

        print(
            "Error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="AI disaster analysis failed."
        )

    print(
        "\n🧠 AI ANALYSIS:"
    )

    print(
        json.dumps(
            analysis,
            indent=2,
            default=str
        )
    )

    # ========================================================
    # GEOCODING
    # ========================================================

    latitude, longitude = (
        geocode_location(location)
    )

    # ========================================================
    # EVENT ID
    # ========================================================

    event_id = str(
        uuid.uuid4()
    )

    # ========================================================
    # NORMALIZE AI DATA
    # ========================================================

    disaster_type = analysis.get(
        "disaster_type",
        "Unknown Disaster"
    )

    severity = analysis.get(
        "severity",
        0
    )

    confidence = analysis.get(
        "confidence",
        0
    )

    victim_estimate = analysis.get(
        "victim_estimate"
    )

    traffic_impact = analysis.get(
        "traffic_impact",
        "low"
    )

    traffic_mapping = {

        "low": 30,

        "medium": 60,

        "high": 85

    }

    traffic_level = traffic_mapping.get(
        str(traffic_impact).lower(),
        30
    )

    # ========================================================
    # EVENT
    # ========================================================

    event = {

        "event_id":
            event_id,

        "location":
            location,

        "description":
            description,

        "disaster_type":
            disaster_type,

        "disaster":
            disaster_type,

        "severity":
            severity,

        "confidence":
            confidence,

        "observations":
            analysis.get(
                "observations",
                []
            ),

        "hazards":
            analysis.get(
                "hazards",
                []
            ),

        "infrastructure_damage":
            analysis.get(
                "infrastructure_damage",
                []
            ),

        "evacuation_required":
            analysis.get(
                "evacuation_required",
                False
            ),

        "victim_estimate":
            victim_estimate,

        "victims":
            victim_estimate or 0,

        "traffic_impact":
            traffic_impact,

        "traffic_level":
            traffic_level,

        "medical_access_impact":
            analysis.get(
                "medical_access_impact",
                "low"
            ),

        "summary":
            analysis.get(
                "summary",
                ""
            ),

        # IMPORTANT
        # Real geocoded coordinates
        "latitude":
            latitude,

        "longitude":
            longitude,

        "status":
            "analyzed"

    }

    # ========================================================
    # DEBUG EVENT
    # ========================================================

    print("\n")
    print("=" * 70)

    print(
        "🧠 DYNAMIC EVENT CREATED"
    )

    print("=" * 70)

    print(
        json.dumps(
            event,
            indent=2,
            default=str
        )
    )

    # ========================================================
    # LANGGRAPH
    # ========================================================

    print("\n")
    print("=" * 70)

    print(
        "🤖 STARTING MULTI-AGENT ORCHESTRATION"
    )

    print("=" * 70)

    try:

        initial_state = {

            "event":
                event,

            "responses":
                []

        }

        result = graph.invoke(
            initial_state
        )

    except Exception as e:

        print(
            "\n❌ LANGGRAPH EXECUTION FAILED"
        )

        print(
            "Error:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Multi-agent disaster analysis failed."
        )

    # ========================================================
    # AGENT RESPONSES
    # ========================================================

    agent_responses = result.get(
        "responses",
        []
    )

    print("\n🤖 AGENT RESPONSES:")

    for response in agent_responses:

        print(
            response
        )

    # ========================================================
    # EXTRACT TRAFFIC ROUTE
    # ========================================================

    route_coordinates = []

    best_route = []

    for response in agent_responses:

        if not isinstance(response, dict):
            continue

        traffic_response = response.get(
            "TrafficAgent"
        )

        if not traffic_response:
            continue

        traffic_response = (
            traffic_response.get(
                "traffic_response",
                {}
            )
        )

        route_coordinates = (
            traffic_response.get(
                "route_coordinates",
                []
            )
        )

        best_route = (
            traffic_response.get(
                "best_route",
                []
            )
        )

        break

    print(
        "\n🛣️ ROUTE COORDINATES:"
    )

    print(
        route_coordinates
    )

    # ========================================================
    # DASHBOARD PAYLOAD
    # ========================================================

    dashboard_payload = {

        "type":
            "disaster_analysis",

        "event":
            event,

        "responses":
            agent_responses,

        "route_coordinates":
            route_coordinates,

        "best_route":
            best_route,

        "location": {

            "name":
                location,

            "latitude":
                latitude,

            "longitude":
                longitude

        },

        "status":
            "completed"

    }

    # ========================================================
    # BROADCAST
    # ========================================================

    print("\n📡 Broadcasting disaster data...")

    await broadcast_disaster_data(
        dashboard_payload
    )

    # ========================================================
    # COMPLETE
    # ========================================================

    print("\n")
    print("=" * 70)

    print(
        "✅ DISASTER ANALYSIS COMPLETE"
    )

    print(
        f"🆔 Event ID: {event_id}"
    )

    print(
        f"🚨 Disaster: {disaster_type}"
    )

    print(
        f"⚠️ Severity: {severity}/10"
    )

    print(
        f"🎯 Confidence: {confidence}"
    )

    print(
        f"📍 Location: {location}"
    )

    print(
        f"🌍 Coordinates: "
        f"{latitude}, {longitude}"
    )

    print("=" * 70)

    # ========================================================
    # API RESPONSE
    # ========================================================

    return {

        "success":
            True,

        "event":
            event,

        "analysis":
            analysis,

        "responses":
            agent_responses,

        "route_coordinates":
            route_coordinates,

        "best_route":
            best_route,

        "location": {

            "name":
                location,

            "latitude":
                latitude,

            "longitude":
                longitude

        },

        "status":
            "completed"

    }