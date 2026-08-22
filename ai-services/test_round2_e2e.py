import sys
import os
import io
from PIL import Image

# Ensure path includes ai-services
sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("\n" + "=" * 70)
print("🧪 TESTING SWARMAI ROUND 2 FEATURES")
print("=" * 70)

# 1. Health check
res = client.get("/health")
print(f"1. Health Check: {res.status_code} -> {res.json()}")
assert res.status_code == 200

# 2. Teams & Vehicles
res_teams = client.get("/api/delegation-teams")
print(f"2. Teams: {res_teams.status_code} -> {len(res_teams.json().get('teams', []))} teams available")
assert res_teams.status_code == 200

res_vehicles = client.get("/api/delegation-vehicles")
print(f"   Vehicles: {res_vehicles.status_code} -> {len(res_vehicles.json().get('vehicles', []))} vehicles available")
assert res_vehicles.status_code == 200

# 3. Create dummy test image
img = Image.new("RGB", (100, 100), color=(73, 109, 137))
img_byte_arr = io.BytesIO()
img.save(img_byte_arr, format='JPEG')
img_bytes = img_byte_arr.getvalue()

# 4. Conflict Check (Clean assignment with fresh timestamp)
import time
ts = int(time.time())
test_incident_id = f"test-incident-{ts}"
check_payload = {
    "incidentId": test_incident_id,
    "teamId": "medical_team_1",
    "vehicleId": "ambulance_01",
    "task": "Triage casualties at Sector 9",
    "startTime": f"2026-09-01T{10 + (ts % 5):02d}:00:00Z",
    "endTime": f"2026-09-01T{12 + (ts % 5):02d}:00:00Z"
}
res_check = client.post("/api/delegation/check", json=check_payload)
print(f"3. Clean Conflict Check: {res_check.status_code} -> hasConflict={res_check.json().get('hasConflict')}, severity={res_check.json().get('severity')}")

# 5. Confirm Delegation
confirm_payload = {
    **check_payload,
    "override": False
}
res_confirm = client.post("/api/delegation/confirm", json=confirm_payload)
print(f"4. Confirm Delegation: {res_confirm.status_code} -> success={res_confirm.json().get('success')}, assignmentId={res_confirm.json().get('assignmentId')}")
assert res_confirm.status_code == 200

# 6. Check Overlapping Delegation (Conflict expected)
overlap_check_payload = {
    "incidentId": f"overlap-incident-{ts}",
    "teamId": "medical_team_1",
    "vehicleId": "ambulance_01",
    "task": "Emergency response at Sector 9",
    "startTime": check_payload["startTime"],
    "endTime": check_payload["endTime"]
}
res_overlap_check = client.post("/api/delegation/check", json=overlap_check_payload)
overlap_data = res_overlap_check.json()
print(f"5. Overlap Conflict Check: {res_overlap_check.status_code} -> hasConflict={overlap_data.get('hasConflict')}, severity={overlap_data.get('severity')}")
print(f"   Conflict details: {overlap_data.get('conflicts')}")
assert overlap_data.get("hasConflict") is True
assert overlap_data.get("severity") == "high"

# 7. Attempt Confirm without override on conflict (Should fail 409)
overlap_confirm_payload = {
    **overlap_check_payload,
    "override": False
}
res_overlap_confirm = client.post("/api/delegation/confirm", json=overlap_confirm_payload)
print(f"6. Rejection of high conflict without override: {res_overlap_confirm.status_code}")
assert res_overlap_confirm.status_code == 409

# 8. Confirm Alternative Team (Medical Team 2 - should succeed)
alt_confirm_payload = {
    **overlap_check_payload,
    "teamId": "medical_team_2",
    "vehicleId": "ambulance_02",
    "override": False
}
res_alt_confirm = client.post("/api/delegation/confirm", json=alt_confirm_payload)
print(f"7. Alternative Team Assignment: {res_alt_confirm.status_code} -> success={res_alt_confirm.json().get('success')}")
assert res_alt_confirm.status_code == 200

# 9. Notification Send
notif_payload = {
    "incidentId": test_incident_id,
    "recipients": ["fire", "hospital", "police"],
    "message": "Immediate backup required at Sector 4"
}
res_notif = client.post("/api/notifications/send", json=notif_payload)
print(f"8. Notification Send: {res_notif.status_code} -> success={res_notif.json().get('success')}, id={res_notif.json().get('notificationId')}")
assert res_notif.status_code == 200

# 10. Notification History
res_notif_hist = client.get(f"/api/notifications/{test_incident_id}")
print(f"9. Notification History: {res_notif_hist.status_code} -> count={res_notif_hist.json().get('total')}")
assert res_notif_hist.status_code == 200

# 11. Incidents Queue
res_incidents = client.get("/api/incidents")
print(f"10. Incident Queue: {res_incidents.status_code} -> total={res_incidents.json().get('total')}")
assert res_incidents.status_code == 200

print("\n" + "=" * 70)
print("✅ ALL ROUND 2 BACKEND ENDPOINTS PASSED SUCCESSFULLY!")
print("=" * 70)
