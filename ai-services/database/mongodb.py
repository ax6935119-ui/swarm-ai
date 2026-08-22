import os
import logging
from pymongo import MongoClient, ASCENDING, DESCENDING
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("swarmai.database")

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "swarmai")

if not MONGODB_URI:
    raise RuntimeError("MONGODB_URI environment variable is required.")

# ============================================================
# ROBUST CONNECTION POOL
# ============================================================

client = MongoClient(
    MONGODB_URI,
    maxPoolSize=50,
    minPoolSize=5,
    maxIdleTimeMS=45000,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    retryWrites=True,
)

db = client[MONGODB_DATABASE]

# Core Collections
disaster_events_collection = db["disaster_events"]
disasters_collection = db["disasters"]
assignments_collection = db["assignments"]
notifications_collection = db["notifications"]
admin_users_collection = db["admin_users"]


# ============================================================
# AUTOMATED ROBUST INDEXING
# ============================================================

def init_indexes():
    """
    Initializes and ensures high-performance indexes across all
    collections for robust scalability, conflict checking, and rapid queries.
    """
    try:
        # 1. disaster_events indexes
        disaster_events_collection.create_index([("event_id", ASCENDING)], unique=True)
        disaster_events_collection.create_index([("status", ASCENDING)])
        disaster_events_collection.create_index([("validationStatus", ASCENDING)])
        disaster_events_collection.create_index([("disaster_type", ASCENDING)])
        disaster_events_collection.create_index([("location", ASCENDING)])
        disaster_events_collection.create_index([("severity", DESCENDING)])
        disaster_events_collection.create_index([("created_at", DESCENDING)])
        disaster_events_collection.create_index([
            ("disaster_type", ASCENDING),
            ("location", ASCENDING),
            ("created_at", DESCENDING)
        ])

        # 2. assignments indexes (Critical for zero-latency conflict detection)
        assignments_collection.create_index([("id", ASCENDING)], unique=True)
        assignments_collection.create_index([("incidentId", ASCENDING)])
        assignments_collection.create_index([("teamId", ASCENDING), ("status", ASCENDING)])
        assignments_collection.create_index([("vehicleId", ASCENDING), ("status", ASCENDING)])
        assignments_collection.create_index([("startTime", ASCENDING), ("endTime", ASCENDING)])
        assignments_collection.create_index([("createdAt", DESCENDING)])

        # 3. notifications indexes
        notifications_collection.create_index([("notification_id", ASCENDING)], unique=True)
        notifications_collection.create_index([("incident_id", ASCENDING), ("dispatched_at", DESCENDING)])

        # 4. admin_users indexes
        admin_users_collection.create_index([("username", ASCENDING)], unique=True)

        print("🛡️ Database indexes initialized and verified.")
    except Exception as e:
        print(f"⚠️ Index initialization notice: {e}")


def check_db_health() -> bool:
    """Verifies that MongoDB cluster is reachable and responding."""
    try:
        client.admin.command("ping")
        return True
    except Exception as e:
        logger.error(f"MongoDB health ping failed: {e}")
        return False