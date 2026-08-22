import sys
import os

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

sys.path.insert(0, os.path.dirname(__file__))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

print("\n" + "=" * 70)
print("🧪 TESTING ADMIN AUTHENTICATION & SECURITY")
print("=" * 70)

# 1. Invalid login test
res_bad = client.post("/api/auth/login", json={"username": "admin", "password": "wrongpassword"})
print(f"1. Invalid Login Attempt: {res_bad.status_code} -> {res_bad.json().get('detail')}")
assert res_bad.status_code == 401

# 2. Valid login test
res_good = client.post("/api/auth/login", json={"username": "admin", "password": "swarmadmin2026"})
print(f"2. Valid Login Attempt:   {res_good.status_code} -> Token: {res_good.json().get('token')[:16]}...")
assert res_good.status_code == 200
token = res_good.json()["token"]

# 3. Verify session endpoint
res_verify = client.get("/api/auth/verify", headers={"Authorization": f"Bearer {token}"})
print(f"3. Session Verification: {res_verify.status_code} -> {res_verify.json()}")
assert res_verify.status_code == 200

# 4. Check incidents queue is clean
res_incidents = client.get("/api/incidents")
print(f"4. Clean Incident Queue: {res_incidents.status_code} -> count: {res_incidents.json().get('total')}")
assert res_incidents.status_code == 200
assert res_incidents.json().get("total") == 0

print("\n" + "=" * 70)
print("✅ ALL AUTH & CLEANUP TESTS PASSED PERFECTLY!")
print("=" * 70 + "\n")
