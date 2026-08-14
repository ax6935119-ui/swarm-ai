import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DATABASE = os.getenv(
    "MONGODB_DATABASE",
    "swarmai"
)

client = MongoClient(
    MONGODB_URI
)

db = client[MONGODB_DATABASE]

disasters_collection = db["disasters"]