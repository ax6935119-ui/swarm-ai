import {
  useEffect,
  useRef,
  useCallback,
} from "react";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function MapDashboard({ data }) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  const mapLoadedRef = useRef(false);

  const disasterMarkerRef = useRef(null);
  const routeMarkersRef = useRef([]);

  const ambulanceRef = useRef(null);
  const ambulanceIntervalRef = useRef(null);

  const routeDataRef = useRef(null);

  const MAPTILER_KEY =
    import.meta.env.VITE_MAPTILER_KEY;

  // =========================================================
  // DEFAULT LOCATION
  // =========================================================

  const DEFAULT_CENTER = [
    73.8567,
    18.5204,
  ];

  // =========================================================
  // GET VALID COORDINATES
  // =========================================================

  const getScenarioCoordinates = useCallback(() => {
    const latitude = Number(
      data?.map?.latitude ??
      data?.scenario?.latitude ??
      data?.event?.latitude ??
      data?.event?.lat
    );

    const longitude = Number(
      data?.map?.longitude ??
      data?.scenario?.longitude ??
      data?.event?.longitude ??
      data?.event?.lng
    );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return {
      latitude,
      longitude,
    };
  }, [data]);

  // =========================================================
  // INITIALIZE MAP
  // =========================================================

  useEffect(() => {
    if (
      !mapContainer.current ||
      mapRef.current
    ) {
      return;
    }

    console.log(
      "🗺️ Initializing MapLibre..."
    );

    if (!MAPTILER_KEY) {
      console.error(
        "❌ VITE_MAPTILER_KEY is missing."
      );

      return;
    }

    const map =
      new maplibregl.Map({
        container:
          mapContainer.current,

        style:
          `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,

        center:
          DEFAULT_CENTER,

        zoom:
          11,

        attributionControl:
          true,
      });

    mapRef.current = map;

    // =======================================================
    // CONTROLS
    // =======================================================

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    // =======================================================
    // MAP LOAD
    // =======================================================

    map.on("load", () => {
      console.log(
        "🗺️ MapLibre map loaded"
      );

      mapLoadedRef.current = true;

      // -----------------------------------------------------
      // DANGER ZONE SOURCE
      // -----------------------------------------------------

      if (
        !map.getSource(
          "danger-zone"
        )
      ) {
        map.addSource(
          "danger-zone",
          {
            type:
              "geojson",

            data: {
              type:
                "FeatureCollection",

              features: [],
            },
          }
        );
      }

      // -----------------------------------------------------
      // DANGER ZONE FILL
      // -----------------------------------------------------

      if (
        !map.getLayer(
          "danger-zone-layer"
        )
      ) {
        map.addLayer({
          id:
            "danger-zone-layer",

          type:
            "fill",

          source:
            "danger-zone",

          paint: {
            "fill-color":
              "#ff3030",

            "fill-opacity":
              0.18,
          },
        });
      }

      // -----------------------------------------------------
      // DANGER ZONE BORDER
      // -----------------------------------------------------

      if (
        !map.getLayer(
          "danger-zone-border"
        )
      ) {
        map.addLayer({
          id:
            "danger-zone-border",

          type:
            "line",

          source:
            "danger-zone",

          paint: {
            "line-color":
              "#ff3030",

            "line-width":
              3,

            "line-opacity":
              0.9,
          },
        });
      }

      // -----------------------------------------------------
      // DRAW EXISTING DATA
      // -----------------------------------------------------

      updateMap();
    });

    // =======================================================
    // MAP ERROR
    // =======================================================

    map.on("error", (event) => {
      console.error(
        "❌ MapLibre error:",
        event
      );
    });

    // =======================================================
    // CLEANUP
    // =======================================================

    return () => {
      console.log(
        "🧹 Cleaning MapLibre..."
      );

      mapLoadedRef.current =
        false;

      if (
        ambulanceIntervalRef.current
      ) {
        clearInterval(
          ambulanceIntervalRef.current
        );

        ambulanceIntervalRef.current =
          null;
      }

      if (
        ambulanceRef.current
      ) {
        ambulanceRef.current.remove();

        ambulanceRef.current =
          null;
      }

      routeMarkersRef.current.forEach(
        (marker) => {
          marker.remove();
        }
      );

      routeMarkersRef.current = [];

      if (
        disasterMarkerRef.current
      ) {
        disasterMarkerRef.current.remove();

        disasterMarkerRef.current =
          null;
      }

      map.remove();

      mapRef.current =
        null;
    };
  }, []);

  // =========================================================
  // UPDATE MAP
  // =========================================================

  const updateMap =
    useCallback(() => {
      const map =
        mapRef.current;

      if (
        !map ||
        !mapLoadedRef.current
      ) {
        console.log(
          "⏳ Map not ready yet"
        );

        return;
      }

      const coordinates =
        getScenarioCoordinates();

      if (!coordinates) {
        console.log(
          "⚠️ No valid disaster coordinates"
        );

        return;
      }

      const {
        latitude,
        longitude,
      } = coordinates;

      console.log(
        "📍 Updating map:",
        latitude,
        longitude
      );

      // =====================================================
      // FLY TO DISASTER
      // =====================================================

      map.flyTo({
        center: [
          longitude,
          latitude,
        ],

        zoom:
          12,

        duration:
          1500,

        essential:
          true,
      });

      // =====================================================
      // DISASTER MARKER
      // =====================================================

      createDisasterMarker(
        map,
        latitude,
        longitude
      );

      // =====================================================
      // DANGER ZONE
      // =====================================================

      updateDangerZone(
        map,
        latitude,
        longitude
      );

      // =====================================================
      // ROUTE
      // =====================================================

      const routeCoordinates =
        data?.map?.coordinates;

      if (
        Array.isArray(
          routeCoordinates
        ) &&
        routeCoordinates.length >= 2
      ) {
        drawBackendRoute(
          routeCoordinates
        );
      }
    }, [
      data,
      getScenarioCoordinates,
    ]);

  // =========================================================
  // UPDATE MAP WHEN DATA CHANGES
  // =========================================================

  useEffect(() => {
    if (
      mapLoadedRef.current
    ) {
      updateMap();
    }
  }, [
    data,
    updateMap,
  ]);

  // =========================================================
  // DISASTER MARKER
  // =========================================================

  const createDisasterMarker =
    useCallback(
      (
        map,
        latitude,
        longitude
      ) => {
        if (
          disasterMarkerRef.current
        ) {
          disasterMarkerRef.current
            .setLngLat([
              longitude,
              latitude,
            ]);

          return;
        }

        const markerElement =
          document.createElement(
            "div"
          );

        markerElement.style.width =
          "34px";

        markerElement.style.height =
          "34px";

        markerElement.style.borderRadius =
          "50%";

        markerElement.style.background =
          "rgba(255, 40, 40, 0.9)";

        markerElement.style.border =
          "3px solid white";

        markerElement.style.boxShadow =
          "0 0 30px rgba(255,0,0,0.95)";

        markerElement.style.position =
          "relative";

        markerElement.style.zIndex =
          "20";

        markerElement.innerHTML = `
          <div style="
            position:absolute;
            inset:7px;
            border-radius:50%;
            background:#ffffff;
          "></div>
        `;

        const popup =
          new maplibregl.Popup({
            offset:
              20,
          }).setHTML(`
            <div style="
              font-family: Arial;
              padding: 5px;
              color: #111;
            ">
              <strong>
                🚨 DISASTER ZONE
              </strong>

              <br />

              ${
                data?.scenario?.name ||
                data?.map?.affectedArea ||
                "Active Disaster"
              }

              <br />

              ${
                data?.scenario?.location ||
                data?.map?.location ||
                "Unknown location"
              }
            </div>
          `);

        disasterMarkerRef.current =
          new maplibregl.Marker({
            element:
              markerElement,
          })
            .setLngLat([
              longitude,
              latitude,
            ])
            .setPopup(
              popup
            )
            .addTo(map);

        console.log(
          "🚨 Disaster marker added"
        );
      },
      [data]
    );

  // =========================================================
  // DANGER ZONE
  // =========================================================

  const updateDangerZone =
    useCallback(
      (
        map,
        latitude,
        longitude
      ) => {
        const source =
          map.getSource(
            "danger-zone"
          );

        if (!source) {
          return;
        }

        const offset =
          0.025;

        const polygon = {
          type:
            "FeatureCollection",

          features: [
            {
              type:
                "Feature",

              geometry: {
                type:
                  "Polygon",

                coordinates: [[
                  [
                    longitude -
                      offset,
                    latitude +
                      offset,
                  ],

                  [
                    longitude +
                      offset,
                    latitude +
                      offset,
                  ],

                  [
                    longitude +
                      offset,
                    latitude -
                      offset,
                  ],

                  [
                    longitude -
                      offset,
                    latitude -
                      offset,
                  ],

                  [
                    longitude -
                      offset,
                    latitude +
                      offset,
                  ],
                ]],
              },
            },
          ],
        };

        source.setData(
          polygon
        );
      },
      []
    );

  // =========================================================
  // DRAW BACKEND ROUTE
  // =========================================================

  const drawBackendRoute =
    useCallback(
      async (coords) => {
        const map =
          mapRef.current;

        if (
          !map ||
          !mapLoadedRef.current
        ) {
          return;
        }

        // ---------------------------------------------------
        // VALIDATE COORDINATES
        // ---------------------------------------------------

        const validCoords =
          coords.filter(
            (point) => {
              const lat =
                Number(
                  point?.lat
                );

              const lng =
                Number(
                  point?.lng
                );

              return (
                Number.isFinite(
                  lat
                ) &&
                Number.isFinite(
                  lng
                )
              );
            }
          );

        if (
          validCoords.length < 2
        ) {
          console.warn(
            "⚠️ Not enough route coordinates"
          );

          return;
        }

        console.log(
          "🚦 REAL TRAFFIC ROUTE RECEIVED:",
          validCoords
        );

        // ---------------------------------------------------
        // REMOVE OLD MARKERS
        // ---------------------------------------------------

        routeMarkersRef.current.forEach(
          (marker) => {
            marker.remove();
          }
        );

        routeMarkersRef.current =
          [];

        // ---------------------------------------------------
        // ADD ROUTE POINT MARKERS
        // ---------------------------------------------------

        validCoords.forEach(
          (point, index) => {
            const markerElement =
              document.createElement(
                "div"
              );

            markerElement.style.width =
              "16px";

            markerElement.style.height =
              "16px";

            markerElement.style.borderRadius =
              "50%";

            markerElement.style.background =
              index ===
              validCoords.length - 1
                ? "#ff3030"
                : "#00e5ff";

            markerElement.style.border =
              "3px solid white";

            markerElement.style.boxShadow =
              "0 0 15px rgba(0,229,255,0.8)";

            const marker =
              new maplibregl.Marker({
                element:
                  markerElement,
              })
                .setLngLat([
                  Number(
                    point.lng
                  ),
                  Number(
                    point.lat
                  ),
                ])
                .setPopup(
                  new maplibregl.Popup()
                    .setHTML(`
                      <strong>
                        ${
                          point.zone ||
                          "Route Point"
                        }
                      </strong>
                    `)
                )
                .addTo(map);

            routeMarkersRef.current.push(
              marker
            );
          }
        );

        // ---------------------------------------------------
        // TRY BACKEND ROUTING API
        // ---------------------------------------------------

        try {
          const formatted =
            validCoords.map(
              (point) => [
                Number(
                  point.lng
                ),
                Number(
                  point.lat
                ),
              ]
            );

          console.log(
            "📡 Requesting real route..."
          );

          const response =
            await fetch(
              `${
                import.meta.env
                  .VITE_BACKEND_URL ||
                "http://127.0.0.1:8000"
              }/route`,
              {
                method:
                  "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body:
                  JSON.stringify({
                    coordinates:
                      formatted,
                  }),
              }
            );

          if (!response.ok) {
            throw new Error(
              `Route API failed: ${response.status}`
            );
          }

          const geojson =
            await response.json();

          console.log(
            "🌍 ROUTE RESPONSE:",
            geojson
          );

          if (
            geojson?.features?.length
          ) {
            drawRouteGeoJSON(
              geojson
            );

            return;
          }
        } catch (error) {
          console.warn(
            "⚠️ Real routing unavailable. Using backend route coordinates.",
            error
          );
        }

        // ---------------------------------------------------
        // FALLBACK ROUTE
        // ---------------------------------------------------

        drawFallbackRoute(
          validCoords
        );
      },
      []
    );

  // =========================================================
  // DRAW GEOJSON ROUTE
  // =========================================================

  const drawRouteGeoJSON =
    useCallback(
      (geojson) => {
        const map =
          mapRef.current;

        if (
          !map ||
          !mapLoadedRef.current
        ) {
          return;
        }

        // ---------------------------------------------------
        // REMOVE OLD ROUTE
        // ---------------------------------------------------

        if (
          map.getLayer(
            "emergency-route"
          )
        ) {
          map.removeLayer(
            "emergency-route"
          );
        }

        if (
          map.getSource(
            "emergency-route"
          )
        ) {
          map.removeSource(
            "emergency-route"
          );
        }

        // ---------------------------------------------------
        // ADD ROUTE
        // ---------------------------------------------------

        map.addSource(
          "emergency-route",
          {
            type:
              "geojson",

            data:
              geojson,
          }
        );

        map.addLayer({
          id:
            "emergency-route",

          type:
            "line",

          source:
            "emergency-route",

          layout: {
            "line-cap":
              "round",

            "line-join":
              "round",
          },

          paint: {
            "line-color":
              "#00e5ff",

            "line-width":
              6,

            "line-opacity":
              0.95,
          },
        });

        console.log(
          "🛣️ Route drawn successfully"
        );

        // ---------------------------------------------------
        // AMBULANCE
        // ---------------------------------------------------

        animateAmbulance(
          geojson
        );

        // ---------------------------------------------------
        // FIT ROUTE
        // ---------------------------------------------------

        fitRoute(
          geojson
        );
      },
      []
    );

  // =========================================================
  // FALLBACK ROUTE
  // =========================================================

  const drawFallbackRoute =
    useCallback(
      (coords) => {
        const map =
          mapRef.current;

        if (
          !map ||
          !mapLoadedRef.current
        ) {
          return;
        }

        const coordinates =
          coords.map(
            (point) => [
              Number(
                point.lng
              ),
              Number(
                point.lat
              ),
            ]
          );

        const geojson = {
          type:
            "Feature",

          geometry: {
            type:
              "LineString",

            coordinates,
          },

          properties: {},
        };

        // ---------------------------------------------------
        // REMOVE OLD ROUTE
        // ---------------------------------------------------

        if (
          map.getLayer(
            "emergency-route"
          )
        ) {
          map.removeLayer(
            "emergency-route"
          );
        }

        if (
          map.getSource(
            "emergency-route"
          )
        ) {
          map.removeSource(
            "emergency-route"
          );
        }

        // ---------------------------------------------------
        // ADD FALLBACK
        // ---------------------------------------------------

        map.addSource(
          "emergency-route",
          {
            type:
              "geojson",

            data:
              geojson,
          }
        );

        map.addLayer({
          id:
            "emergency-route",

          type:
            "line",

          source:
            "emergency-route",

          layout: {
            "line-cap":
              "round",

            "line-join":
              "round",
          },

          paint: {
            "line-color":
              "#00e5ff",

            "line-width":
              6,

            "line-opacity":
              0.95,

            "line-dasharray":
              [
                1,
                1,
              ],
          },
        });

        console.log(
          "🛣️ Fallback route drawn"
        );

        animateAmbulance(
          geojson
        );

        fitRoute(
          geojson
        );
      },
      []
    );

  // =========================================================
  // FIT MAP TO ROUTE
  // =========================================================

  const fitRoute =
    useCallback(
      (geojson) => {
        const map =
          mapRef.current;

        if (
          !map ||
          !geojson
        ) {
          return;
        }

        let coordinates = [];

        const feature =
          geojson?.features?.[0];

        if (
          feature?.geometry
            ?.coordinates
        ) {
          coordinates =
            feature.geometry.coordinates;
        } else if (
          geojson?.geometry
            ?.coordinates
        ) {
          coordinates =
            geojson.geometry.coordinates;
        }

        if (
          !coordinates.length
        ) {
          return;
        }

        const bounds =
          new maplibregl.LngLatBounds();

        coordinates.forEach(
          (coordinate) => {
            if (
              Array.isArray(
                coordinate
              ) &&
              coordinate.length >= 2
            ) {
              bounds.extend(
                coordinate
              );
            }
          }
        );

        if (
          !bounds.isEmpty()
        ) {
          map.fitBounds(
            bounds,
            {
              padding:
                80,

              maxZoom:
                14,

              duration:
                1200,
            }
          );
        }
      },
      []
    );

  // =========================================================
  // AMBULANCE ANIMATION
  // =========================================================

  const animateAmbulance =
    useCallback(
      (geojson) => {
        const map =
          mapRef.current;

        if (
          !map ||
          !geojson
        ) {
          return;
        }

        let coordinates = [];

        const feature =
          geojson?.features?.[0];

        if (
          feature?.geometry
            ?.coordinates
        ) {
          coordinates =
            feature.geometry.coordinates;
        } else if (
          geojson?.geometry
            ?.coordinates
        ) {
          coordinates =
            geojson.geometry.coordinates;
        }

        if (
          !Array.isArray(
            coordinates
          ) ||
          coordinates.length === 0
        ) {
          return;
        }

        // ---------------------------------------------------
        // STOP PREVIOUS
        // ---------------------------------------------------

        if (
          ambulanceIntervalRef.current
        ) {
          clearInterval(
            ambulanceIntervalRef.current
          );
        }

        // ---------------------------------------------------
        // REMOVE OLD
        // ---------------------------------------------------

        if (
          ambulanceRef.current
        ) {
          ambulanceRef.current.remove();
        }

        // ---------------------------------------------------
        // AMBULANCE ELEMENT
        // ---------------------------------------------------

        const ambulanceElement =
          document.createElement(
            "div"
          );

        ambulanceElement.innerHTML =
          "🚑";

        ambulanceElement.style.fontSize =
          "30px";

        ambulanceElement.style.lineHeight =
          "30px";

        ambulanceElement.style.filter =
          "drop-shadow(0 0 8px rgba(255,255,255,0.9))";

        ambulanceElement.style.zIndex =
          "30";

        // ---------------------------------------------------
        // CREATE MARKER
        // ---------------------------------------------------

        ambulanceRef.current =
          new maplibregl.Marker({
            element:
              ambulanceElement,

            anchor:
              "center",
          })
            .setLngLat(
              coordinates[0]
            )
            .addTo(map);

        // ---------------------------------------------------
        // ANIMATION
        // ---------------------------------------------------

        let index = 0;

        ambulanceIntervalRef.current =
          setInterval(() => {
            if (
              index >=
              coordinates.length
            ) {
              clearInterval(
                ambulanceIntervalRef.current
              );

              ambulanceIntervalRef.current =
                null;

              return;
            }

            ambulanceRef.current?.setLngLat(
              coordinates[index]
            );

            index++;
          }, 250);

        console.log(
          "🚑 Ambulance animation started"
        );
      },
      []
    );

  // =========================================================
  // UI
  // =========================================================

  return (
    <div
      className="
        bg-slate-900
        rounded-2xl
        overflow-hidden
        shadow-xl
        border
        border-slate-800
        w-full
        h-[600px]
        relative
      "
    >
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div
        className="
          absolute
          top-0
          left-0
          right-0
          z-50
          p-4
          bg-slate-950/90
          backdrop-blur-md
          border-b
          border-slate-800
        "
      >
        <div
          className="
            flex
            items-center
            justify-between
            gap-4
          "
        >
          {/* TITLE */}

          <div>
            <h2
              className="
                text-xl
                font-bold
                text-white
              "
            >
              🌍 Live Disaster Route Map
            </h2>

            <p
              className="
                text-sm
                text-slate-400
                mt-1
              "
            >
              {data?.scenario?.name ||
                data?.map?.affectedArea ||
                "Monitoring active disaster"}

              {" • "}

              {data?.scenario?.location ||
                data?.map?.location ||
                "Unknown location"}
            </p>
          </div>

          {/* LIVE STATUS */}

          <div
            className="
              flex
              items-center
              gap-2
              px-3
              py-2
              rounded-lg
              bg-red-500/10
              border
              border-red-500/30
            "
          >
            <span
              className="
                w-2
                h-2
                rounded-full
                bg-red-500
                animate-pulse
              "
            />

            <span
              className="
                text-xs
                font-semibold
                text-red-400
              "
            >
              LIVE
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          MAP CONTAINER
      ===================================================== */}

      <div
        ref={mapContainer}
        className="
          absolute
          inset-0
          w-full
          h-full
        "
      />
    </div>
  );
}