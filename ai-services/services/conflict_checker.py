"""
SwarmAI — Conflict Checker Service (Round 2)

Checks for scheduling, resource, duplicate, and capacity
conflicts before a delegation assignment is confirmed.
"""

from datetime import datetime
from database.mongodb import assignments_collection


# ============================================================
# STATIC TEAM / VEHICLE REGISTRY
# (For demo — extendable to a DB collection)
# ============================================================

TEAMS = {
    "fire_team_1":   {"name": "Fire Brigade Team 1", "role": "fire"},
    "fire_team_2":   {"name": "Fire Brigade Team 2", "role": "fire"},
    "police_team_1": {"name": "Police Unit Alpha",    "role": "police"},
    "police_team_2": {"name": "Police Unit Bravo",    "role": "police"},
    "medical_team_1":{"name": "Medical Response Team 1", "role": "medical"},
    "medical_team_2":{"name": "Medical Response Team 2", "role": "medical"},
    "rescue_team_1": {"name": "Search & Rescue Team 1",  "role": "rescue"},
    "rescue_team_2": {"name": "Search & Rescue Team 2",  "role": "rescue"},
}

VEHICLES = {
    "truck_01": {"name": "Fire Truck 01",     "type": "fire_truck"},
    "truck_02": {"name": "Fire Truck 02",     "type": "fire_truck"},
    "truck_03": {"name": "Fire Truck 03",     "type": "fire_truck"},
    "truck_04": {"name": "Fire Truck 04",     "type": "fire_truck"},
    "ambulance_01": {"name": "Ambulance 01",  "type": "ambulance"},
    "ambulance_02": {"name": "Ambulance 02",  "type": "ambulance"},
    "police_van_01":{"name": "Police Van 01", "type": "police_van"},
    "police_van_02":{"name": "Police Van 02", "type": "police_van"},
    "rescue_van_01":{"name": "Rescue Van 01", "type": "rescue_van"},
}

# Maximum active assignments per team before capacity warning
CAPACITY_LIMIT = 3


# ============================================================
# HELPER: TIME OVERLAP
# ============================================================

def _times_overlap(
    start_a: datetime,
    end_a: datetime,
    start_b: datetime,
    end_b: datetime,
) -> float:
    """
    Returns the overlap in hours between two time windows.
    Returns 0 if no overlap.
    """
    latest_start = max(start_a, start_b)
    earliest_end = min(end_a, end_b)

    if latest_start < earliest_end:
        delta = earliest_end - latest_start
        return round(delta.total_seconds() / 3600, 2)

    return 0.0


# ============================================================
# HELPER: FIND ALTERNATE TEAM
# ============================================================

def _suggest_alternate_team(team_id: str) -> str:
    team = TEAMS.get(team_id, {})
    role = team.get("role", "")

    for tid, tdata in TEAMS.items():
        if tid != team_id and tdata.get("role") == role:
            return tdata["name"]

    return "Contact Dispatch for alternate assignment"


# ============================================================
# HELPER: FIND ALTERNATE VEHICLE
# ============================================================

def _suggest_alternate_vehicle(vehicle_id: str) -> str:
    vehicle = VEHICLES.get(vehicle_id, {})
    vtype = vehicle.get("type", "")

    for vid, vdata in VEHICLES.items():
        if vid != vehicle_id and vdata.get("type") == vtype:
            return vdata["name"]

    return "Request additional vehicle from depot"


# ============================================================
# MAIN CONFLICT CHECKER
# ============================================================

def check_conflicts(
    team_id: str,
    vehicle_id: str,
    task: str,
    start_time: datetime,
    end_time: datetime,
    incident_id: str,
) -> dict:
    """
    Runs all conflict checks and returns a structured result.

    Returns:
        {
            "hasConflict": bool,
            "severity": "high" | "medium" | "low" | "none",
            "conflicts": [ { type, message, detail, suggestion } ]
        }
    """

    conflicts = []

    # ----------------------------------------------------------
    # Fetch all active assignments for comparison
    # ----------------------------------------------------------
    try:
        active_assignments = list(
            assignments_collection.find(
                {"status": "active"},
                {"_id": 0}
            )
        )
    except Exception:
        active_assignments = []


    for assignment in active_assignments:

        a_start = assignment.get("startTime")
        a_end   = assignment.get("endTime")
        a_team  = assignment.get("teamId", "")
        a_veh   = assignment.get("vehicleId", "")
        a_task  = assignment.get("task", "")
        a_iid   = assignment.get("incidentId", "")

        if isinstance(a_start, str):
            try:
                a_start = datetime.fromisoformat(a_start)
            except Exception:
                a_start = None

        if isinstance(a_end, str):
            try:
                a_end = datetime.fromisoformat(a_end)
            except Exception:
                a_end = None

        if not a_start or not a_end:
            continue

        overlap_hours = _times_overlap(
            start_time, end_time,
            a_start, a_end
        )


        # ------------------------------------------------------
        # 1. SCHEDULE CONFLICT — same team, overlapping window
        # ------------------------------------------------------
        if a_team == team_id and overlap_hours > 0:

            team_name = TEAMS.get(team_id, {}).get(
                "name", team_id
            )

            conflicts.append({
                "type": "schedule",
                "message": (
                    f"{team_name} is already assigned "
                    f"to Incident #{a_iid[:8]} "
                    f"({a_start.strftime('%H:%M')}–"
                    f"{a_end.strftime('%H:%M')}). "
                    f"Overlap: {overlap_hours}h."
                ),
                "detail": {
                    "conflictingIncident": a_iid,
                    "existingStart": a_start.isoformat(),
                    "existingEnd":   a_end.isoformat(),
                    "requestedStart": start_time.isoformat(),
                    "requestedEnd":   end_time.isoformat(),
                    "overlapHours":   overlap_hours,
                },
                "suggestion": _suggest_alternate_team(team_id),
            })


        # ------------------------------------------------------
        # 2. RESOURCE CONFLICT — same vehicle, overlapping window
        # ------------------------------------------------------
        if (
            vehicle_id
            and a_veh == vehicle_id
            and overlap_hours > 0
        ):

            veh_name = VEHICLES.get(vehicle_id, {}).get(
                "name", vehicle_id
            )

            conflicts.append({
                "type": "resource",
                "message": (
                    f"{veh_name} is already reserved "
                    f"for Incident #{a_iid[:8]} "
                    f"({a_start.strftime('%H:%M')}–"
                    f"{a_end.strftime('%H:%M')})."
                ),
                "detail": {
                    "conflictingIncident": a_iid,
                    "existingStart": a_start.isoformat(),
                    "existingEnd":   a_end.isoformat(),
                    "overlapHours":  overlap_hours,
                },
                "suggestion": _suggest_alternate_vehicle(vehicle_id),
            })


        # ------------------------------------------------------
        # 3. DUPLICATE ASSIGNMENT — same task + team + incident
        # ------------------------------------------------------
        if (
            a_team == team_id
            and a_iid == incident_id
            and a_task.strip().lower() == task.strip().lower()
        ):

            team_name = TEAMS.get(team_id, {}).get(
                "name", team_id
            )

            conflicts.append({
                "type": "duplicate",
                "message": (
                    f"This exact task is already assigned "
                    f"to {team_name} for this incident."
                ),
                "detail": {
                    "existingAssignment": assignment.get("id"),
                },
                "suggestion": (
                    "Modify the task description or cancel "
                    "the existing assignment first."
                ),
            })


    # ----------------------------------------------------------
    # 4. CAPACITY WARNING — team has too many active assignments
    # ----------------------------------------------------------
    try:
        active_count = assignments_collection.count_documents({
            "teamId": team_id,
            "status": "active",
        })
    except Exception:
        active_count = 0

    if active_count >= CAPACITY_LIMIT:

        team_name = TEAMS.get(team_id, {}).get(
            "name", team_id
        )

        conflicts.append({
            "type": "capacity",
            "message": (
                f"{team_name} already has {active_count} "
                f"active assignments (limit: {CAPACITY_LIMIT}). "
                "Performance may be degraded."
            ),
            "detail": {
                "activeAssignments": active_count,
                "limit": CAPACITY_LIMIT,
            },
            "suggestion": (
                _suggest_alternate_team(team_id)
            ),
        })


    # ----------------------------------------------------------
    # DETERMINE SEVERITY
    # ----------------------------------------------------------

    has_high = any(
        c["type"] in ("schedule", "resource", "duplicate")
        for c in conflicts
    )

    has_medium = any(
        c["type"] == "capacity"
        for c in conflicts
    )

    if has_high:
        severity = "high"
    elif has_medium:
        severity = "medium"
    elif conflicts:
        severity = "low"
    else:
        severity = "none"

    return {
        "hasConflict": len(conflicts) > 0,
        "severity": severity,
        "conflicts": conflicts,
    }


# ============================================================
# REGISTRY HELPERS (used by delegation routes)
# ============================================================

def get_teams():
    return [
        {"id": tid, **tdata}
        for tid, tdata in TEAMS.items()
    ]


def get_vehicles():
    return [
        {"id": vid, **vdata}
        for vid, vdata in VEHICLES.items()
    ]
