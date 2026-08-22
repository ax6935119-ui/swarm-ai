"""
SwarmAI — Notification Routes (Round 2)

POST /api/notifications/send  — send alert to selected responder teams
GET  /api/notifications/{incident_id} — fetch notification history
"""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from database.mongodb import notifications_collection

router = APIRouter(prefix="/api", tags=["Notifications"])


# ============================================================
# RESPONDER REGISTRY
# ============================================================

RESPONDER_LABELS = {
    "sos":       "SOS Contacts",
    "fire":      "Fire Brigade",
    "police":    "Police",
    "hospital":  "Hospital",
    "ambulance": "Ambulance Services",
}


# ============================================================
# REQUEST SCHEMA
# ============================================================

class NotificationRequest(BaseModel):
    incidentId: str = Field(..., description="Event ID of the incident")
    recipients: list[str] = Field(
        ...,
        description="List of recipient codes: sos, fire, police, hospital, ambulance"
    )
    message: str = Field(
        default="",
        description="Optional custom message to include"
    )


# ============================================================
# SEND NOTIFICATION
# ============================================================

@router.post("/notifications/send")
def send_notification(body: NotificationRequest):
    """
    Logs a notification dispatch to the notifications collection.
    In production this would trigger SMS / push / radio relay.
    """

    if not body.recipients:
        raise HTTPException(
            status_code=400,
            detail="At least one recipient must be selected."
        )

    # Resolve recipient labels
    resolved = []
    for code in body.recipients:
        label = RESPONDER_LABELS.get(code)
        if not label:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown recipient code: '{code}'. "
                       f"Valid codes: {list(RESPONDER_LABELS.keys())}"
            )
        resolved.append({"code": code, "label": label})

    notification_id = str(uuid.uuid4())

    record = {
        "notification_id":  notification_id,
        "incident_id":      body.incidentId,
        "recipients":       resolved,
        "message":          body.message or f"Emergency alert for incident {body.incidentId[:8].upper()}.",
        "status":           "dispatched",
        "dispatched_at":    datetime.now(timezone.utc),
    }

    try:
        notifications_collection.insert_one(record)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to persist notification: {e}"
        )

    print(
        f"📣 NOTIFICATION SENT | "
        f"Incident: {body.incidentId[:8].upper()} | "
        f"Recipients: {[r['label'] for r in resolved]}"
    )

    return {
        "success":          True,
        "notificationId":   notification_id,
        "incidentId":       body.incidentId,
        "recipients":       resolved,
        "message":          record["message"],
        "dispatchedAt":     record["dispatched_at"].isoformat(),
    }


# ============================================================
# GET NOTIFICATION HISTORY
# ============================================================

@router.get("/notifications/{incident_id}")
def get_notifications(incident_id: str):
    """
    Returns notification history for a given incident.
    """

    try:
        records = list(
            notifications_collection.find(
                {"incident_id": incident_id},
                {"_id": 0}
            )
            .sort("dispatched_at", -1)
            .limit(20)
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch notifications: {e}"
        )

    # Serialize datetimes
    for r in records:
        if isinstance(r.get("dispatched_at"), datetime):
            r["dispatched_at"] = r["dispatched_at"].isoformat()

    return {
        "incidentId":    incident_id,
        "notifications": records,
        "total":         len(records),
    }
