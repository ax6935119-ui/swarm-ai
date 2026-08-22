import os
import sys

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

# Ensure root ai-services is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from database.mongodb import (
    disaster_events_collection,
    assignments_collection,
    notifications_collection,
    disasters_collection,
    init_indexes,
)

print("\n" + "=" * 70)
print("SWARMAI DATABASE & STORAGE CLEANUP")
print("=" * 70)

# Delete from MongoDB collections
e_res = disaster_events_collection.delete_many({})
a_res = assignments_collection.delete_many({})
n_res = notifications_collection.delete_many({})
d_res = disasters_collection.delete_many({})

print(f"Deleted disaster_events: {e_res.deleted_count}")
print(f"Deleted assignments:     {a_res.deleted_count}")
print(f"Deleted notifications:   {n_res.deleted_count}")
print(f"Deleted disasters:       {d_res.deleted_count}")

# Clean uploads directory
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
deleted_files = 0
if os.path.exists(uploads_dir):
    for f in os.listdir(uploads_dir):
        fp = os.path.join(uploads_dir, f)
        if os.path.isfile(fp):
            try:
                os.remove(fp)
                deleted_files += 1
            except Exception as e:
                print(f"Failed to remove {f}: {e}")

print(f"Removed evidence files:  {deleted_files}")

# Rebuild clean robust indexes
print("\nRebuilding database indexes for future updates...")
init_indexes()

print("\n" + "=" * 70)
print("DATABASE & EVIDENCE STORAGE ARE NOW 100% CLEAN!")
print("=" * 70 + "\n")
