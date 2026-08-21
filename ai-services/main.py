import os
import sys

# Force UTF-8 output so emoji in print() calls don't crash
# on Windows terminals that default to cp1252.
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr.encoding != "utf-8":
    sys.stderr.reconfigure(encoding="utf-8")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


# ============================================================
# API ROUTERS
# ============================================================

from api.dashboard_routes import (
    router as dashboard_router
)

from api.status_routes import (
    router as status_router
)

from api.disaster_routes import (
    router as disaster_router
)

from api.map_routes import (
    router as map_router
)

from api.scenario_routes import (
    router as scenario_router
)


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="SwarmAI Disaster System",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]


env_origins = os.getenv(
    "ALLOWED_ORIGINS"
)

if env_origins:

    allowed_origins.extend(
        [
            origin.strip()
            for origin in env_origins.split(",")
            if origin.strip()
        ]
    )


app.add_middleware(
    CORSMiddleware,

    allow_origins=allowed_origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {
        "message": "SwarmAI Disaster Backend Running",
        "status": "online"
    }


# ============================================================
# ROUTERS
# ============================================================

app.include_router(
    dashboard_router
)

app.include_router(
    status_router
)

app.include_router(
    disaster_router
)

app.include_router(
    map_router
)

app.include_router(
    scenario_router
)