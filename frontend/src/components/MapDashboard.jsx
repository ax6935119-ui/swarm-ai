import {
  useEffect,
  useRef,
  useState,
} from "react";

import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";


export default function MapDashboard({
  data,
}) {

  const mapContainer =
    useRef(null);

  const mapRef =
    useRef(null);

  const ambulanceRef =
    useRef(null);

  const animationRef =
    useRef(null);

  const markersRef =
    useRef([]);

  const mapLoadedRef =
    useRef(false);

  const [mapReady, setMapReady] =
    useState(false);


  const [
    ,
    setRouteInfo,
  ] = useState({

    status:
      "Waiting for simulation",

    route:
      [],

    facility:
      null,

    vehicle:
      "ambulance"
  });


  const MAPTILER_KEY =
    import.meta.env
      .VITE_MAPTILER_KEY;


  // =========================================================
  // INITIALIZE MAP
  // =========================================================

  useEffect(() => {

    if (
      mapRef.current
    ) {

      return;
    }


    if (
      !MAPTILER_KEY
    ) {

      console.error(
        "VITE_MAPTILER_KEY is missing"
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
          [73.8567, 18.5204],

        zoom:
          11,

      });


    mapRef.current =
      map;


    map.addControl(

      new maplibregl.NavigationControl(),

      "top-right"

    );


    map.on(
      "load",
      () => {

        mapLoadedRef.current =
          true;

        setMapReady(true);

        console.log(
          "Map loaded successfully"
        );

      }
    );


    return () => {

      if (
        animationRef.current
      ) {

        clearInterval(
          animationRef.current
        );

      }


      markersRef.current.forEach(
        marker => marker.remove()
      );


      markersRef.current =
        [];


      if (
        ambulanceRef.current
      ) {

        ambulanceRef.current.remove();

      }


      map.remove();

      mapRef.current =
        null;

      mapLoadedRef.current =
        false;

      setMapReady(false);

    };

  }, []);


  // =========================================================
  // GET MAP COORDINATES
  // =========================================================

  const getScenarioCoordinates =
    () => {

      const latitude =
        Number(

          data?.map?.latitude ??

          data?.scenario?.latitude ??

          data?.event?.latitude ??

          data?.event?.lat

        );


      const longitude =
        Number(

          data?.map?.longitude ??

          data?.scenario?.longitude ??

          data?.event?.longitude ??

          data?.event?.lng

        );


      if (

        !Number.isFinite(
          latitude
        )

        ||

        !Number.isFinite(
          longitude
        )

      ) {

        return null;

      }


      return {

        lat:
          latitude,

        lng:
          longitude

      };

    };


  // =========================================================
  // GET ROUTE COORDINATES
  // =========================================================

  const getRouteCoordinates =
    () => {

      const coordinates =

        data?.map?.coordinates ||

        data?.traffic_response
          ?.route_coordinates ||

        [];


      if (

        !Array.isArray(
          coordinates
        )

      ) {

        return [];

      }


      return coordinates.filter(
        point =>

          Number.isFinite(
            Number(
              point?.lat
            )
          )

          &&

          Number.isFinite(
            Number(
              point?.lng
            )
          )

      );

    };


  // =========================================================
  // UPDATE MAP
  // =========================================================

  useEffect(() => {

    const map =
      mapRef.current;


    if (
      !map
      ||
      !mapLoadedRef.current
      ||
      !data
    ) {

      return;

    }


    const coordinates =
      getScenarioCoordinates();


    const routeCoordinates =
      getRouteCoordinates();


    // -------------------------------------------------------
    // CENTER ON DISASTER
    // -------------------------------------------------------

    if (
      coordinates
    ) {

      map.flyTo({

        center: [

          coordinates.lng,

          coordinates.lat

        ],

        zoom:
          12,

        duration:
          1200,

        essential:
          true

      });

    }


    // -------------------------------------------------------
    // ROUTE
    // -------------------------------------------------------

    if (

      routeCoordinates.length >= 2

    ) {

      fetchRealRoute(
        routeCoordinates
      );

    }

  }, [
    data,
    mapReady
  ]);


  // =========================================================
  // FETCH REAL ROUTE
  // =========================================================

  const fetchRealRoute =
    async (
      coords
    ) => {

      const routeEndpoints = [
        coords[0],
        coords[coords.length - 1],
      ];

      try {
        const formatted =
          routeEndpoints.map(
            point => [

              Number(
                point.lng
              ),

              Number(
                point.lat
              )

            ]
          );


        const backendUrl =

          import.meta.env
            .VITE_BACKEND_URL

          ||

          "http://127.0.0.1:8000";


        const response =
          await fetch(

            `${backendUrl}/route`,

            {

              method:
                "POST",

              headers: {

                "Content-Type":
                  "application/json"

              },

              body:
                JSON.stringify({

                  coordinates:
                    formatted

                })

            }

          );


        if (
          !response.ok
        ) {

          throw new Error(
            "Route API failed"
          );

        }


        const geojson =
          await response.json();


        if (

          !geojson?.features

          ||

          !geojson.features[0]

        ) {

          drawFallbackRoute(
            routeEndpoints
          );

          return;

        }


        drawRoute(

          geojson,

          routeEndpoints

        );

      }

      catch (
        error
      ) {

        console.warn(

          "Route API unavailable. Using fallback route.",

          error

        );


        drawFallbackRoute(
          routeEndpoints
        );

      }

    };


  // =========================================================
  // CLEAR MAP
  // =========================================================

  const clearMapLayers =
    () => {

      const map =
        mapRef.current;


      if (
        !map
      ) {

        return;

      }


      [

        "route-line",

        "route-glow",

        "danger-zone-fill",

        "danger-zone-border"

      ].forEach(
        layer => {

          if (
            map.getLayer(
              layer
            )
          ) {

            map.removeLayer(
              layer
            );

          }

        }
      );


      [

        "route",

        "danger-zone"

      ].forEach(
        source => {

          if (
            map.getSource(
              source
            )
          ) {

            map.removeSource(
              source
            );

          }

        }
      );


      markersRef.current.forEach(
        marker => {

          marker.remove();

        }
      );


      markersRef.current =
        [];


      if (
        ambulanceRef.current
      ) {

        ambulanceRef.current.remove();

        ambulanceRef.current =
          null;

      }


      if (
        animationRef.current
      ) {

        clearInterval(
          animationRef.current
        );

        animationRef.current =
          null;

      }

    };


  // =========================================================
  // FALLBACK ROUTE
  // =========================================================

  const drawFallbackRoute =
    (
      coords
    ) => {

      const fallbackGeojson = {

        type:
          "FeatureCollection",

        features: [

          {

            type:
              "Feature",

            properties:
              {},

            geometry: {

              type:
                "LineString",

              coordinates:

                coords.map(
                  point => [

                    Number(
                      point.lng
                    ),

                    Number(
                      point.lat
                    )

                  ]
                )

            }

          }

        ]

      };


      drawRoute(

        fallbackGeojson,

        coords

      );

    };


  // =========================================================
  // DRAW ROUTE
  // =========================================================

  const drawRoute =
    (
      geojson,
      coords
    ) => {

      const map =
        mapRef.current;


      if (
        !map
      ) {

        return;

      }


      clearMapLayers();


      const routeCoords =

        geojson
          ?.features?.[0]
          ?.geometry
          ?.coordinates

        ||

        [];


      const disasterPoint =

        coords[
          coords.length - 1
        ];


      if (
        disasterPoint
      ) {

        addDangerZone(
          disasterPoint
        );

      }


      // -----------------------------------------------------
      // ROUTE SOURCE
      // -----------------------------------------------------

      map.addSource(

        "route",

        {

          type:
            "geojson",

          data:
            geojson

        }

      );


      // -----------------------------------------------------
      // ROUTE GLOW
      // -----------------------------------------------------

      map.addLayer({

        id:
          "route-glow",

        type:
          "line",

        source:
          "route",

        layout: {

          "line-cap":
            "round",

          "line-join":
            "round"

        },

        paint: {

          "line-color":
            "#ef4444",

          "line-width":
            16,

          "line-opacity":
            0.2

        }

      });


      // -----------------------------------------------------
      // MAIN ROUTE
      // -----------------------------------------------------

      map.addLayer({

        id:
          "route-line",

        type:
          "line",

        source:
          "route",

        layout: {

          "line-cap":
            "round",

          "line-join":
            "round"

        },

        paint: {

          "line-color":
            "#ff3b30",

          "line-width":
            6,

          "line-opacity":
            0.95

        }

      });


      addMarkers(
        coords
      );


      fitToRoute(
        routeCoords
      );


      animateEmergencyVehicle(
        routeCoords
      );


      const trafficData =

        data?.agents
          ?.TrafficAgent

        ||

        data?.traffic_response

        ||

        {};


      setRouteInfo({

        status:

          trafficData
            ?.route_status

          ||

          "Emergency Route Active",


        route:

          coords.map(
            point =>
              point.zone ||
              "Route Point"
          ),


        facility:

          trafficData
            ?.selected_facility

          ||

          coords[0]

          ||

          null,


        vehicle:

          trafficData
            ?.vehicle_type

          ||

          "ambulance"

      });

    };


  // =========================================================
  // DANGER ZONE
  // =========================================================

  const addDangerZone =
    (
      point
    ) => {

      const map =
        mapRef.current;


      if (
        !point
        ||
        !map
      ) {

        return;

      }


      const lng =
        Number(
          point.lng
        );

      const lat =
        Number(
          point.lat
        );


      if (

        !Number.isFinite(
          lng
        )

        ||

        !Number.isFinite(
          lat
        )

      ) {

        return;

      }


      const severity =
        Number(

          data?.scenario?.severity ??

          data?.event?.severity ??

          5

        );


      // Larger disaster = larger danger zone

      const size =

        Math.min(

          0.04,

          Math.max(

            0.008,

            severity * 0.003

          )

        );


      const polygon = {

        type:
          "FeatureCollection",

        features: [

          {

            type:
              "Feature",

            properties:
              {},

            geometry: {

              type:
                "Polygon",

              coordinates: [[

                [

                  lng - size,

                  lat + size

                ],

                [

                  lng + size,

                  lat + size

                ],

                [

                  lng + size,

                  lat - size

                ],

                [

                  lng - size,

                  lat - size

                ],

                [

                  lng - size,

                  lat + size

                ]

              ]]

            }

          }

        ]

      };


      map.addSource(

        "danger-zone",

        {

          type:
            "geojson",

          data:
            polygon

        }

      );


      map.addLayer({

        id:
          "danger-zone-fill",

        type:
          "fill",

        source:
          "danger-zone",

        paint: {

          "fill-color":
            "#ef4444",

          "fill-opacity":
            0.22

        }

      });


      map.addLayer({

        id:
          "danger-zone-border",

        type:
          "line",

        source:
          "danger-zone",

        paint: {

          "line-color":
            "#ef4444",

          "line-width":
            3,

          "line-opacity":
            0.9

        }

      });

    };


  // =========================================================
  // ADD MARKERS
  // =========================================================

  const addMarkers =
    (
      coords
    ) => {

      coords.forEach(

        (
          point,
          index
        ) => {

          const marker =
            document.createElement(
              "div"
            );


          marker.className =
            "custom-map-marker";


          const isStart =
            index === 0;


          const isEnd =
            index ===
            coords.length - 1;


          const type =
            String(
              point.type ||
              ""
            ).toLowerCase();


          // -------------------------------------------------
          // ICON
          // -------------------------------------------------

          let icon =
            "📍";


          if (

            type === "hospital"

            ||

            type === "medical"

          ) {

            icon =
              "🏥";

          }

          else if (

            type === "fire_station"

          ) {

            icon =
              "🚒";

          }

          else if (

            type === "shelter"

          ) {

            icon =
              "🏠";

          }

          else if (

            isEnd

            ||

            type === "disaster"

          ) {

            icon =
              "🚨";

          }

          else if (

            type === "checkpoint"

          ) {

            icon =
              "🛣️";

          }


          marker.innerHTML =
            icon;


          marker.style.width =
            isEnd
              ? "46px"
              : "42px";


          marker.style.height =
            isEnd
              ? "46px"
              : "42px";


          marker.style.borderRadius =
            "50%";


          marker.style.display =
            "flex";


          marker.style.alignItems =
            "center";


          marker.style.justifyContent =
            "center";


          marker.style.fontSize =
            "22px";


          marker.style.border =
            "3px solid white";


          marker.style.cursor =
            "pointer";


          marker.style.background =

            isEnd

              ? "#dc2626"

              : isStart

                ? "#2563eb"

                : "#0891b2";


          marker.style.boxShadow =

            isEnd

              ? "0 0 35px rgba(239,68,68,1)"

              : "0 0 22px rgba(56,189,248,0.9)";


          const popup =
            new maplibregl.Popup({

              offset:
                20

            }).setHTML(`

              <div style="
                min-width:180px;
                font-family:Arial;
                color:#111;
                padding:6px;
              ">

                <strong>
                  ${point.zone || "Emergency Point"}
                </strong>

                <br/>

                <span style="
                  font-size:12px;
                  color:#555;
                ">

                  ${type || "route"}

                </span>

              </div>

            `);


          const mapMarker =
            new maplibregl.Marker({

              element:
                marker

            })

              .setLngLat([

                Number(
                  point.lng
                ),

                Number(
                  point.lat
                )

              ])

              .setPopup(
                popup
              )

              .addTo(
                mapRef.current
              );


          markersRef.current.push(
            mapMarker
          );

        }

      );

    };


  // =========================================================
  // FIT ROUTE
  // =========================================================

  const fitToRoute =
    (
      routeCoords
    ) => {

      const map =
        mapRef.current;


      if (

        !map

        ||

        !routeCoords.length

      ) {

        return;

      }


      const bounds =
        new maplibregl.LngLatBounds();


      routeCoords.forEach(

        coord => {

          bounds.extend(
            coord
          );

        }

      );


      map.fitBounds(

        bounds,

        {

          padding:
            90,

          maxZoom:
            14,

          duration:
            1200

        }

      );

    };


  // =========================================================
  // EMERGENCY VEHICLE ANIMATION
  // =========================================================

  const animateEmergencyVehicle =
    (
      routeCoords
    ) => {

      const map =
        mapRef.current;


      if (

        !map

        ||

        !routeCoords.length

      ) {

        return;

      }


      if (
        ambulanceRef.current
      ) {

        ambulanceRef.current.remove();

      }


      if (
        animationRef.current
      ) {

        clearInterval(
          animationRef.current
        );

      }


      const vehicle =
        document.createElement(
          "div"
        );


      const trafficData =

        data?.agents
          ?.TrafficAgent

        ||

        data?.traffic_response

        ||

        {};


      const vehicleType =
        trafficData?.vehicle_type

        ||

        trafficData?.traffic_response?.vehicle_type

        ||

        "ambulance";

      const normalizedVehicleType = String(
        vehicleType
      ).toLowerCase();


      let vehicleIcon =
        "🚑";


      if (

        normalizedVehicleType.includes(
          "fire"
        )

      ) {

        vehicleIcon =
          "🚒";

      }

      else if (

        normalizedVehicleType.includes(
          "evacuation"
        )

      ) {

        vehicleIcon =
          "🚌";

      }

      else if (

        normalizedVehicleType.includes(
          "rescue"
        )

      ) {

        vehicleIcon =
          "🚑";

      }


      vehicle.innerHTML =
        vehicleIcon;


      vehicle.style.fontSize =
        "34px";


      vehicle.style.filter =
        "drop-shadow(0 0 12px rgba(239,68,68,1))";


      ambulanceRef.current =
        new maplibregl.Marker({

          element:
            vehicle,

          anchor:
            "center"

        })

          .setLngLat(
            routeCoords[0]
          )

          .addTo(
            map
          );


      let index =
        0;


      animationRef.current =
        setInterval(
          () => {

            if (

              index >=
              routeCoords.length

            ) {

              clearInterval(
                animationRef.current
              );


              animationRef.current =
                null;


              setRouteInfo(
                previous => ({

                  ...previous,

                  status:
                    "Emergency Unit Reached Disaster Zone"

                })
              );


              return;

            }


            ambulanceRef.current
              ?.setLngLat(

                routeCoords[
                  index
                ]

              );


            index += 1;

          },

          60
        );

    };


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="

      relative

      bg-slate-900

      rounded-2xl

      overflow-hidden

      shadow-xl

      border

      border-slate-800

      h-[550px]

    ">


      {/* HEADER */}

      <div className="

        absolute

        top-0

        left-0

        right-0

        z-20

        p-4

        bg-slate-950/95

        backdrop-blur-md

        border-b

        border-slate-800

      ">


        <div className="

          flex

          justify-between

          items-center

        ">


          <div>

            <h2 className="

              text-xl

              font-bold

              text-white

            ">

              🌍 Intelligent Disaster Response Map

            </h2>


            <p className="

              text-xs

              text-slate-400

              mt-1

            ">

              {data?.scenario?.name ||

                data?.event?.disaster ||

                data?.event?.disaster_type ||

                "Active Emergency"}

              {" • "}

              {data?.scenario?.location ||

                data?.event?.location ||

                "Monitoring location"}

            </p>

          </div>


          <div className="

            flex

            items-center

            gap-2

            px-3

            py-2

            rounded-lg

            bg-red-500/10

            border

            border-red-500/30

          ">

            <span className="

              w-2

              h-2

              rounded-full

              bg-red-500

              animate-pulse

            "/>


            <span className="

              text-xs

              font-bold

              text-red-400

            ">

              LIVE RESPONSE

            </span>

          </div>

        </div>

      </div>


      {/* MAP */}

      <div

        ref={
          mapContainer
        }

        className="

          w-full

          h-full

        "

      />

    </div>

  );

}