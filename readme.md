# 🚨 SwarmAI - Multi-Agent Disaster Response System

# Overview

SwarmAI is an AI-powered disaster response platform that leverages multiple intelligent agents to coordinate emergency operations during disaster situations.

The system simulates real-world emergency response workflows by combining:

* Multi-Agent AI Architecture
* LangGraph Orchestration
* LLM-Based Reasoning
* Real-Time Communication
* Interactive Disaster Mapping
* Resource Allocation & Route Optimization

SwarmAI demonstrates how autonomous agents can collaborate to improve decision-making during floods, earthquakes, fires, chemical leaks, and other emergency scenarios.


# 🌐 Live Demo

Website:
https://swarmai-disaster-system.pages.dev/

⚠️ Important Notice

This project uses a backend hosted on Render's free tier.
The first request after inactivity may take **30–60 seconds** to load because the backend automatically goes to sleep when not in use.
If the dashboard does not respond immediately:
1. Wait for 30–60 seconds.
2. Click **Start Simulation** again.
3. The system will function normally after the backend wakes up.
This is a limitation of the free hosting plan and not an issue with the application itself.

# Problem Statement

During disasters, emergency response teams face several challenges:

* Delayed decision making
* Lack of coordination between departments
* Inefficient resource allocation
* Traffic congestion affecting rescue operations
* Limited visibility into real-time disaster conditions

SwarmAI addresses these challenges through a coordinated AI-driven disaster management platform.



# Key Features

1. 🤖 Multi-Agent Coordination

The platform consists of four specialized AI agents:

2. 🚨 Emergency Agent

Responsible for:

* Disaster severity analysis
* Emergency assessment
* Rescue team activation
* Critical response recommendations



3. 🏥 Medical Agent

Responsible for:

* Victim analysis
* Medical prioritization
* Emergency medical deployment
* Triage recommendations



4. 🚦 Traffic Agent

Responsible for:

* Traffic condition monitoring
* Route optimization
* Emergency vehicle routing
* Alternate route generation



5. 🚑 Resource Agent

Responsible for:

* Resource allocation
* Ambulance deployment
* Rescue team distribution
* Operational planning



6. AI Reasoning

Each agent uses LLM-powered reasoning to explain:

* Why a decision was made
* What information influenced the decision
* Recommended actions

This provides transparency and explainability during emergency response.



7. Real-Time Dashboard

The dashboard provides:

8. Live Statistics

* Severity Level
* Victim Count
* Traffic Conditions
* Active Agents

9. Agent Status Monitoring

* Agent State
* Confidence Score
* Execution Time
* Final Decision

10. AI Reasoning Panel

Detailed explanation of agent decisions.

11. Communication Panel

Inter-agent communication and coordination updates.

12. Activity Logs

Real-time simulation activity tracking.



13. Interactive Disaster Map

The platform includes a live operational map built using MapLibre.

Features:

* Disaster Heat Zones
* Hospital Locations
* Disaster Zones
* Route Visualization
* Animated Ambulance Movement
* Emergency Response Tracking



## System Architecture

# Frontend

* React.js
* Vite
* Tailwind CSS
* MapLibre GL
* MapTiler

---

# Backend

* FastAPI
* Python

---

# AI Layer

* LangGraph
* Groq LLM
* Multi-Agent Architecture

---

# Communication

* WebSockets
* Real-Time Event Streaming

---

# Workflow

1. User starts a disaster simulation.
2. Disaster event is sent to FastAPI backend.
3. LangGraph orchestrates agent execution.
4. Agents analyze the event.
5. Agents generate decisions.
6. Groq LLM generates reasoning.
7. Results are streamed to the frontend using WebSockets.
8. Dashboard updates in real time.
9. Route optimization and disaster visualization are displayed on the map.

---

# Supported Disaster Types

* Flood
* Earthquake
* Fire
* Chemical Leak
* Terror Attack

---

# Project Structure


SwarmAI/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── pages/
│
├── ai-services/
│   ├── agents/
│   │   ├── emergency_agent.py
│   │   ├── medical_agent.py
│   │   ├── traffic_agent.py
│   │   └── resource_agent.py
│   │
│   ├── orchestrator/
│   │   └── langgraph_orchestrator.py
│   │
│   ├── websocket/
│   ├── services/
│   ├── api/
│   └── main.py
│
└── README.md


---

# Installation

## Backend

```bash
cd ai-services

python -m venv .venv

source .venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --reload
```

Backend runs on:


http://127.0.0.1:8000


---

## Frontend

```bash
cd frontend

npm install

npm run dev
```

Frontend runs on:


http://localhost:5173


---

# Environment Variables

## Backend

Create `.env`

```env
GROQ_API_KEY=your_groq_api_key
ORS_API_KEY=your_openrouteservice_key
```

---

## Frontend

Create `.env`

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_WS_URL=ws://127.0.0.1:8000/ws/disaster
VITE_MAPTILER_KEY=your_maptiler_key
```

---

# Future Enhancements

* Real Disaster Data Integration
* Government Control Room Integration
* Predictive Disaster Analytics
* Drone-Based Emergency Coordination
* Shelter Recommendation System
* Multi-City Simulation Support
* Resource Demand Forecasting

---

# Impact

SwarmAI demonstrates how AI agents can collaborate to:

* Improve disaster response times
* Optimize emergency routes
* Allocate resources efficiently
* Enhance situational awareness
* Provide explainable AI decision-making

The platform serves as a prototype for next-generation AI-powered emergency command systems.

---

# Team

SwarmAI Development Team

Built using:

* FastAPI
* React
* LangGraph
* Groq
* WebSockets
* MapLibre
* MapTiler
* Tailwind CSS

---

## License

MIT License