import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { connectWebSocket } from "../services/websocket";

let socket = null;

const INITIAL_DATA = {
  stats: {
    severity: 0,
    victims: 0,
    traffic: 0,
    activeAgents: 0,
  },

  agents: {},

  logs: [],

  reasoning: [],

  communications: [],

  map: {
    affectedArea: "Disaster Zone",
    location: "Unknown",
    latitude: null,
    longitude: null,
    route: [],
    coordinates: [],
    heatZones: [],
  },

  scenario: null,
};


// ============================================================
// HOOK
// ============================================================

export default function useDashboardData() {

  const [dashboardData, setDashboardData] =
    useState(INITIAL_DATA);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);


  // ============================================================
  // TRANSFORM BACKEND DATA
  // ============================================================

  const transformBackendData = useCallback((rawData) => {

    if (!rawData) {

      console.log(
        "⏭️ Empty dashboard payload ignored"
      );

      return;
    }


    console.log(
      "📦 BACKEND PAYLOAD:",
      rawData
    );


    // ========================================================
    // CASE 1
    // DIRECT DISASTER ANALYSIS RESPONSE
    //
    // POST /disaster/analyze
    // ========================================================

    if (
      rawData.success === true &&
      rawData.event
    ) {

      console.log(
        "🚨 REAL DISASTER EVENT RECEIVED"
      );

      transformDisasterEvent(
        rawData.event,
        rawData
      );

      return;
    }


    // ========================================================
    // CASE 2
    // ORCHESTRATION RESPONSE
    // ========================================================

    if (
      rawData.event &&
      rawData.responses
    ) {

      console.log(
        "🤖 MULTI-AGENT DISASTER EVENT RECEIVED"
      );

      transformDisasterEvent(
        rawData.event,
        rawData
      );

      return;
    }


    // ========================================================
    // CASE 3
    // NESTED DATA
    // ========================================================

    if (
      rawData.data?.event
    ) {

      console.log(
        "📦 NESTED DISASTER EVENT RECEIVED"
      );

      transformDisasterEvent(
        rawData.data.event,
        rawData.data
      );

      return;
    }


    // ========================================================
    // CASE 4
    // OLD DASHBOARD DATA
    // ========================================================

    if (
      rawData.disaster !== undefined ||
      rawData.severity !== undefined ||
      rawData.victims !== undefined ||
      rawData.active_agents !== undefined
    ) {

      transformInitialDashboard(
        rawData
      );

      return;
    }


    console.log(
      "⏭️ Unknown backend payload:",
      rawData
    );

  }, []);


  // ============================================================
  // INITIAL DASHBOARD LOAD + WEBSOCKET
  // ============================================================

  useEffect(() => {

    let mounted = true;


    const initializeDashboard = async () => {

      try {

        const response = await axios.get(
          "http://127.0.0.1:8000/dashboard/data"
        );


        console.log(
          "📊 INITIAL DASHBOARD:",
          response.data
        );


        if (mounted) {

          transformBackendData(
            response.data
          );

        }

      } catch (err) {

        console.error(
          "❌ Dashboard API Error:",
          err
        );

        if (mounted) {

          setError(true);

        }

      } finally {

        if (mounted) {

          setLoading(false);

        }

      }

    };


    initializeDashboard();


    // ========================================================
    // WEBSOCKET
    // ========================================================

    if (!socket) {

      socket = connectWebSocket(
        (liveData) => {

          console.log(
            "📡 LIVE WEBSOCKET DATA:",
            liveData
          );


          if (mounted) {

            transformBackendData(
              liveData
            );

          }

        }
      );

    }


    return () => {

      mounted = false;

    };

  }, [transformBackendData]);


  // ============================================================
  // INITIAL DASHBOARD TRANSFORM
  // ============================================================

  const transformInitialDashboard = (
    data
  ) => {

    console.log(
      "📊 PROCESSING INITIAL DASHBOARD:",
      data
    );


    setDashboardData(
      (previous) => ({

        ...previous,

        stats: {

          severity:
            Number(
              data.severity
            ) || 0,

          victims:
            Number(
              data.victims
            ) || 0,

          traffic:
            typeof data.traffic === "number"

              ? data.traffic

              : data.traffic === "High"

                ? 85

                : data.traffic === "Medium"

                  ? 60

                  : 20,

          activeAgents:
            Number(
              data.active_agents
            ) || 0,

        },


        map: {

          ...previous.map,

          affectedArea:
            data.disaster ||
            "Disaster Zone",

          location:
            data.location ||
            "Unknown",

        },

      })
    );

  };


  // ============================================================
  // REAL DISASTER EVENT TRANSFORMER
  // ============================================================

  const transformDisasterEvent = (
    event,
    apiData = {}
  ) => {

    if (!event) {

      console.log(
        "⏭️ Disaster event missing"
      );

      return;
    }


    console.log(
      "🔥 PROCESSING REAL DISASTER:",
      event
    );


    // ========================================================
    // AGENTS
    // ========================================================

    const agents = {};


    const responses =
      Array.isArray(
        apiData.responses
      )
        ? apiData.responses
        : [];


    responses.forEach(
      (agentObj) => {

        if (!agentObj) {
          return;
        }


        // ----------------------------------------------------
        // NORMAL FORMAT
        // ----------------------------------------------------

        if (agentObj.agent) {

          const agentData =
            agentObj.data ||
            agentObj;


          agents[
            agentObj.agent
          ] = {

            ...agentData,

            agent:
              agentObj.agent,

          };

          return;
        }


        // ----------------------------------------------------
        // CURRENT LANGGRAPH FORMAT
        //
        // {
        //   EmergencyAgent: {...}
        // }
        // ----------------------------------------------------

        if (
          typeof agentObj === "object"
        ) {

          Object.entries(
            agentObj
          ).forEach(
            ([name, value]) => {

              agents[name] = {

                ...(value || {}),

                agent: name,

              };

            }
          );

        }

      }
    );


    console.log(
      "🤖 FINAL AGENTS:",
      agents
    );


    // ========================================================
    // LOGS
    // ========================================================

    const logs =
      Object.values(
        agents
      ).map(
        (agent) => {

          const name =
            agent?.agent ||
            "UnknownAgent";


          return (
            `${name} completed execution`
          );

        }
      );


    // ========================================================
    // REASONING
    // ========================================================

    const reasoning =
      Object.values(
        agents
      ).map(
        (agent) => ({

          agent:
            agent?.agent ||
            "UnknownAgent",

          reasoning:
            agent?.reasoning ||
            "No reasoning available",

        })
      );


    // ========================================================
    // TRAFFIC AGENT
    // ========================================================

    const trafficAgent =
      agents["TrafficAgent"];


    const routeCoords =
      trafficAgent
        ?.traffic_response
        ?.route_coordinates ||
      [];


    const bestRoute =
      trafficAgent
        ?.traffic_response
        ?.best_route ||
      [];


    console.log(
      "🚦 TRAFFIC AGENT:",
      trafficAgent
    );


    console.log(
      "🛣️ ROUTE COORDINATES:",
      routeCoords
    );


    // ========================================================
    // REAL COORDINATES
    // ========================================================

    const latitude =
      Number(
        event.latitude ??
        event.lat
      );


    const longitude =
      Number(
        event.longitude ??
        event.lng
      );


    // ========================================================
    // SEVERITY
    // ========================================================

    const severity =
      Number(
        event.severity
      ) || 0;


    // ========================================================
    // VICTIMS
    //
    // IMPORTANT:
    // victim_estimate can legitimately be null.
    // We should NOT convert null into a fake victim count.
    // ========================================================

    const victimValue =
      event.victim_estimate;


    const victims =
      typeof victimValue === "number"
        ? victimValue
        : (
            typeof event.victims === "number"
              ? event.victims
              : 0
          );


    // ========================================================
    // TRAFFIC
    // ========================================================

    let traffic =
      Number(
        event.traffic_level
      );


    if (
      Number.isNaN(traffic)
    ) {

      const impact =
        event.traffic_impact;


      if (impact === "high") {

        traffic = 85;

      } else if (
        impact === "medium"
      ) {

        traffic = 60;

      } else {

        traffic = 20;

      }

    }


    // ========================================================
    // COMMUNICATIONS
    // ========================================================

    const communications = [];


    // Traffic → Resource

    if (traffic >= 70) {

      communications.push({

        from:
          "TrafficAgent",

        to:
          "ResourceAgent",

        message:
          `Heavy traffic detected near ${
            event.location ||
            "disaster zone"
          }. Alternate emergency routing recommended.`,

      });

    }


    // Medical → Resource

    if (
      event.medical_access_impact ===
      "high"
    ) {

      communications.push({

        from:
          "MedicalAgent",

        to:
          "ResourceAgent",

        message:
          "Medical access is severely affected. Alternate medical access is required.",

      });

    }


    // ========================================================
    // HEAT ZONE
    //
    // Only create a real heat point when we have
    // actual geocoded coordinates.
    // ========================================================

    const heatZones = [];


    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {

      heatZones.push({

        lat:
          latitude,

        lng:
          longitude,

        intensity:
          severity,

      });

    }


    // ========================================================
    // FINAL DASHBOARD OBJECT
    // ========================================================

    const transformed = {

      stats: {

        severity,

        victims,

        traffic,

        activeAgents:
          Object.keys(
            agents
          ).length,

      },


      agents,


      logs,


      reasoning,


      communications,


      map: {

        affectedArea:
          event.disaster_type ||
          event.disaster ||
          "Disaster Zone",

        location:
          event.location ||
          "Unknown",

        latitude:
          Number.isFinite(latitude)
            ? latitude
            : null,

        longitude:
          Number.isFinite(longitude)
            ? longitude
            : null,

        route:
          bestRoute,

        coordinates:
          routeCoords,

        heatZones,

      },


      // ======================================================
      // REAL EVENT
      // ======================================================

      scenario: {

        id:
          event.event_id ||
          event.scenario_id ||
          null,

        name:
          event.disaster_type ||
          event.disaster ||
          "Real-World Disaster",

        disaster:
          event.disaster_type ||
          event.disaster ||
          "Unknown Disaster",

        location:
          event.location ||
          "Unknown",

        severity,

        victims,

        confidence:
          event.confidence || 0,

        evacuation_required:
          event.evacuation_required ||
          false,

      },

    };


    console.log(
      "✅ UPDATED REAL-WORLD DASHBOARD:",
      transformed
    );


    setDashboardData(
      transformed
    );

  };


  // ============================================================
  // RETURN
  // ============================================================

  return {

    dashboardData,

    loading,

    error,

  };

}