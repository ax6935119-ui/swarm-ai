import {
  useEffect,
  useState,
  useCallback,
} from "react";

import API from "../services/api";

import {
  connectWebSocket,
  disconnectWebSocket,
} from "../services/websocket";


// ============================================================
// INITIAL DASHBOARD STATE
// ============================================================

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

    affectedArea:
      "Disaster Zone",

    location:
      "Unknown",

    latitude:
      null,

    longitude:
      null,

    route: [],

    coordinates: [],

    heatZones: [],

  },

  scenario:
    null,

};


// ============================================================
// HOOK
// ============================================================

export default function useDashboardData() {

  const [
    dashboardData,
    setDashboardData,
  ] = useState(
    INITIAL_DATA
  );


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState(false);


  // ============================================================
  // TRANSFORM DISASTER EVENT
  // ============================================================

  const transformDisasterEvent = useCallback(
    (
      event,
      backendData = {}
    ) => {

      if (!event) {

        console.log(
          "⏭️ No disaster event"
        );

        return;

      }


      console.log(
        "🚨 Transforming disaster event:",
        event
      );


      // ========================================================
      // BASIC EVENT DATA
      // ========================================================

      const severity =
        Number(
          event.severity ?? 0
        );


      const victims =
        Number(
          event.victims ??
          event.victim_estimate ??
          0
        );


      const traffic =
        Number(
          event.traffic_level ??
          0
        );


      // ========================================================
      // LOCATION
      // ========================================================

      const latitude =
        event.latitude ??
        event.lat ??
        null;


      const longitude =
        event.longitude ??
        event.lng ??
        null;


      const location =
        event.location ??
        "Unknown";


      // ========================================================
      // BACKEND RESPONSES
      // ========================================================

      const responses =
        backendData.responses ??
        [];


      // ========================================================
      // AGENTS
      // ========================================================

      const agents = {};


      responses.forEach(
        (item) => {

          if (!item) {
            return;
          }


          Object.entries(
            item
          ).forEach(
            (
              [
                agentName,
                response,
              ]
            ) => {

              agents[
                agentName
              ] = {

                ...response,

                name:
                  agentName,

              };

            }
          );

        }
      );


      // ========================================================
      // REASONING
      // ========================================================

      const reasoning = [];


      Object.entries(
        agents
      ).forEach(
        (
          [
            agentName,
            agent,
          ]
        ) => {

          if (
            agent?.reasoning
          ) {

            reasoning.push({

              agent:
                agentName,

              reasoning:
                agent.reasoning,

            });

          }

        }
      );


      // ========================================================
      // ROUTE
      // ========================================================

      let route = [];

      let coordinates = [];


      const trafficAgent =
        agents.TrafficAgent;


      if (
        trafficAgent?.traffic_response
      ) {

        route =
          trafficAgent
            .traffic_response
            .best_route ??
          [];


        coordinates =
          trafficAgent
            .traffic_response
            .route_coordinates ??
          [];

      }


      // ========================================================
      // COMMUNICATIONS
      // ========================================================

      const communications =
        backendData.communications ??
        backendData.messages ??
        [];


      // ========================================================
      // LOGS
      // ========================================================

      const logs = [];


      responses.forEach(
        (item) => {

          Object.entries(
            item || {}
          ).forEach(
            (
              [
                agentName,
                response,
              ]
            ) => {

              logs.push({

                agent:
                  agentName,

                status:
                  response?.status ??
                  "UNKNOWN",

                decision:
                  response?.decision ??
                  response
                    ?.traffic_response
                    ?.route_status ??
                  "No decision",

                timestamp:
                  new Date().toISOString(),

              });

            }
          );

        }
      );


      // ========================================================
      // ACTIVE AGENTS
      // ========================================================

      const activeAgents =
        Object.keys(
          agents
        ).length;


      // ========================================================
      // MAP DATA
      // ========================================================

      const map = {

        affectedArea:
          event.disaster ??
          event.disaster_type ??
          "Disaster Zone",

        location,

        latitude,

        longitude,

        route,

        coordinates,

        facilities:
          trafficAgent?.traffic_response?.nearby_facilities ??
          [],

        vehicleType:
          trafficAgent?.traffic_response?.vehicle_type ??
          "ambulance",

        heatZones:
          backendData.heatZones ??
          [],

      };


      // ========================================================
      // SCENARIO
      // ========================================================

      const scenario =
        backendData.scenario ??
        event.scenario ??
        null;


      // ========================================================
      // FINAL DASHBOARD DATA
      // ========================================================

      setDashboardData(
        (
          previous
        ) => ({

          ...previous,

          stats: {

            severity,

            victims,

            traffic,

            activeAgents,

          },

          agents,

          logs,

          reasoning,

          communications,

          map,

          scenario,

        })
      );


      console.log(
        "📊 DASHBOARD UPDATED:",
        {

          severity,

          victims,

          traffic,

          activeAgents,

          agents,

        }
      );

    },
    []
  );


  // ============================================================
  // OLD DASHBOARD DATA FORMAT
  // ============================================================

  const transformInitialDashboard =
    useCallback(
      (
        rawData
      ) => {

        console.log(
          "📊 Transforming legacy dashboard data:",
          rawData
        );


        const severity =
          Number(
            rawData.severity ??
            0
          );


        const victims =
          Number(
            rawData.victims ??
            rawData.victim_estimate ??
            0
          );


        const traffic =
          Number(
            rawData.traffic_level ??
            rawData.traffic ??
            0
          );


        const latitude =
          rawData.latitude ??
          rawData.lat ??
          null;


        const longitude =
          rawData.longitude ??
          rawData.lng ??
          null;


        const location =
          rawData.location ??
          "Unknown";


        setDashboardData(
          (
            previous
          ) => ({

            ...previous,

            stats: {

              severity,

              victims,

              traffic,

              activeAgents:
                Number(
                  rawData.active_agents ??
                  0
                ),

            },

            map: {

              ...previous.map,

              location,

              latitude,

              longitude,

            },

            scenario:
              rawData.scenario ??
              null,

          })
        );

      },
      []
    );


  // ============================================================
  // BACKEND PAYLOAD TRANSFORMATION
  // ============================================================

  const transformBackendData =
    useCallback(
      (
        rawData
      ) => {

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


        // ======================================================
        // CASE 1
        // DIRECT DISASTER ANALYSIS RESPONSE
        //
        // Example:
        //
        // {
        //   success: true,
        //   event: {...},
        //   responses: [...]
        // }
        // ======================================================

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


        // ======================================================
        // CASE 2
        // LANGGRAPH ORCHESTRATION RESPONSE
        // ======================================================

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


        // ======================================================
        // CASE 3
        // NESTED DATA
        // ======================================================

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


        // ======================================================
        // CASE 4
        // WEBSOCKET DASHBOARD MESSAGE
        // ======================================================

        if (
          rawData.type ===
            "disaster" &&
          rawData.event
        ) {

          console.log(
            "📡 WEBSOCKET DISASTER EVENT"
          );


          transformDisasterEvent(
            rawData.event,
            rawData
          );


          return;

        }


        // ======================================================
        // CASE 5
        // OLD DASHBOARD DATA
        // ======================================================

        if (

          rawData.disaster !==
            undefined ||

          rawData.disaster_type !==
            undefined ||

          rawData.severity !==
            undefined ||

          rawData.victims !==
            undefined ||

          rawData.active_agents !==
            undefined

        ) {

          transformInitialDashboard(
            rawData
          );


          return;

        }


        // ======================================================
        // UNKNOWN PAYLOAD
        // ======================================================

        console.log(
          "⏭️ Unknown backend payload:",
          rawData
        );

      },
      [
        transformDisasterEvent,
        transformInitialDashboard,
      ]
    );


  // ============================================================
  // INITIAL DASHBOARD LOAD + WEBSOCKET
  // ============================================================

  useEffect(
    () => {

      let mounted = true;


      // ========================================================
      // INITIAL REST API REQUEST
      // ========================================================

      const initializeDashboard =
        async () => {

          try {

            setLoading(true);

            setError(false);


            console.log(
              "📡 Loading initial dashboard..."
            );


            const response =
              await API.get(
                "/dashboard/data"
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

          }
          catch (
            requestError
          ) {

            console.error(
              "❌ Dashboard initialization error:",
              requestError
            );


            if (mounted) {

              setError(true);

            }

          }
          finally {

            if (mounted) {

              setLoading(false);

            }

          }

        };


      // ========================================================
      // LOAD DASHBOARD
      // ========================================================

      initializeDashboard();


      // ========================================================
      // WEBSOCKET
      // ========================================================

      console.log(
        "🔌 Initializing dashboard WebSocket..."
      );


      connectWebSocket({

        // ------------------------------------------------------
        // CONNECTED
        // ------------------------------------------------------

        onOpen:
          () => {

            console.log(
              "🟢 Dashboard WebSocket connected"
            );

          },


        // ------------------------------------------------------
        // MESSAGE
        // ------------------------------------------------------

        onMessage:
          (
            data
          ) => {

            console.log(
              "📡 Dashboard WebSocket data:",
              data
            );


            if (!mounted) {

              return;

            }


            transformBackendData(
              data
            );

          },


        // ------------------------------------------------------
        // ERROR
        // ------------------------------------------------------

        onError:
          (
            websocketError
          ) => {

            console.error(
              "❌ Dashboard WebSocket error:",
              websocketError
            );

          },


        // ------------------------------------------------------
        // CLOSED
        // ------------------------------------------------------

        onClose:
          () => {

            console.log(
              "🔴 Dashboard WebSocket closed"
            );

          },

      });


      // ========================================================
      // CLEANUP
      // ========================================================

      return () => {

        mounted = false;


        console.log(
          "🧹 Cleaning dashboard connection..."
        );


        disconnectWebSocket();

      };

    },
    [
      transformBackendData,
    ]
  );


  // ============================================================
  // RETURN
  // ============================================================

  return {

    dashboardData,

    loading,

    error,

  };

}