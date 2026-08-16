import {
  useEffect,
  useRef,
  useState,
} from "react";

import maplibregl from "maplibre-gl";

import "maplibre-gl/dist/maplibre-gl.css";

import API from "../services/api"; // use configured backend URL


export default function MapDashboard({ data }) {

  const mapContainer = useRef(null);

  const mapRef = useRef(null);

  const disasterMarkerRef = useRef(null);

  const ambulanceRef = useRef(null);

  const ambulanceIntervalRef = useRef(null);


  const MAPTILER_KEY =
    import.meta.env.VITE_MAPTILER_KEY;

// State to handle missing key & loading UI
const [mapError, setMapError] = useState(false);
const [isMapLoading, setIsMapLoading] = useState(true);


  // =========================================================
  // INITIALIZE MAP
  // =========================================================

  useEffect(() => {

    if (
      mapRef.current ||
      !mapContainer.current
    ) {
      return;
    }


    if (!MAPTILER_KEY) {
  console.error("❌ VITE_MAPTILER_KEY is missing");
  setMapError(true);
  return;
}


    const map =
      new maplibregl.Map({

        container:
          mapContainer.current,

        style:
          `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,

        center: [
          73.8567,
          18.5204
        ],

        zoom: 11

      });


    mapRef.current = map;


    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );


    map.on("load", () => {

  console.log("🗺️ MapLibre map loaded");
  setIsMapLoading(false);

      // =====================================================
      // DANGER ZONE SOURCE
      // =====================================================

      if (
        !map.getSource("danger-zone")
      ) {

        map.addSource(
          "danger-zone",
          {

            type:
              "geojson",

            data: {

              type:
                "FeatureCollection",

              features: []

            }

          }
        );

      }


      // =====================================================
      // DANGER ZONE FILL
      // =====================================================

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
              "#ff3b30",
            "fill-opacity":
              0.20,
            "fill-opacity-transition": { "duration": 500 }
          }

        });

      }


      // =====================================================
      // DANGER ZONE BORDER
      // =====================================================

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
              "#ff3b30",

            "line-width":
              3,

            "line-opacity":
              0.9

          }

        });

      }

    });


  }, [MAPTILER_KEY]);


  // =========================================================
  // UPDATE DISASTER LOCATION
  // =========================================================

  useEffect(() => {

    const map =
      mapRef.current;


    if (!map) {
      return;
    }


    const latitude =
      Number(
        data?.map?.latitude
      );


    const longitude =
      Number(
        data?.map?.longitude
      );


    console.log(
      "📍 MAP COORDINATES:",
      {
        latitude,
        longitude
      }
    );


    // =======================================================
    // INVALID COORDINATES
    // =======================================================

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {

      console.log(
        "⏳ Waiting for real disaster coordinates..."
      );

      return;
    }


    console.log(
      "🌍 Moving map to:",
      latitude,
      longitude
    );


    // =======================================================
    // MOVE MAP
    // =======================================================

    map.flyTo({

      center: [
        longitude,
        latitude
      ],

      zoom: 12,

      duration: 1800,

      essential: true

    });


    // =======================================================
    // DISASTER MARKER
    // =======================================================

    if (
      disasterMarkerRef.current
    ) {

      disasterMarkerRef.current
        .setLngLat([
          longitude,
          latitude
        ]);

    }

    else {

      const element =
        document.createElement(
          "div"
        );


      element.style.width =
        "32px";

      element.style.height =
        "32px";

      element.style.borderRadius =
        "50%";

      element.style.background =
        "rgba(255,40,40,0.9)";

      element.style.border =
        "3px solid white";

      element.style.boxShadow =
        "0 0 35px rgba(255,0,0,0.9)";


      disasterMarkerRef.current =
        new maplibregl.Marker({

          element

        })

          .setLngLat([
            longitude,
            latitude
          ])

          .setPopup(

            (() => {
  const container = document.createElement("div");
  container.style.fontFamily = "Arial";
  container.style.padding = "6px";

  const title = document.createElement("strong");
  title.textContent = "🚨 Disaster Zone";
  container.appendChild(title);
  container.appendChild(document.createElement("br"));

  const name = document.createElement("span");
  name.textContent = data?.scenario?.name || data?.map?.affectedArea || "Active Disaster";
  container.appendChild(name);
  container.appendChild(document.createElement("br"));

  const loc = document.createElement("span");
  loc.textContent = data?.scenario?.location || data?.map?.location || "Unknown location";
  container.appendChild(loc);
  container.appendChild(document.createElement("br"));

  const severity = document.createElement("span");
  severity.textContent = `Severity: ${data?.stats?.severity ?? 0}/10`;
  container.appendChild(severity);

  return new maplibregl.Popup().setDOMContent(container);
})()

          )

          .addTo(map);

    }


    // =======================================================
    // DANGER ZONE
    // =======================================================

    if (
      !map.isStyleLoaded() ||
      !map.getSource("danger-zone")
    ) {

      return;
    }


    const offset =
      0.025;


    const polygon = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [longitude - offset, latitude + offset],
        [longitude + offset, latitude + offset],
        [longitude + offset, latitude - offset],
        [longitude - offset, latitude - offset],
        [longitude - offset, latitude + offset]
      ]]
    }
  }]
};
// Apply a subtle fade‑in for the danger zone after data is set
map.getSource("danger-zone").setData(polygon);
setTimeout(() => {
  map.setPaintProperty("danger-zone-layer", "fill-opacity", 0.2);
}, 200);


  }, [

    data?.map?.latitude,

    data?.map?.longitude,

    data?.scenario?.name,

    data?.scenario?.location,

    data?.stats?.severity

  ]);


  // =========================================================
  // ROUTE
  // =========================================================

  useEffect(() => {

    const coords =
      data?.map?.coordinates;


    console.log(
      "🗺️ MAP DATA:",
      data
    );


    console.log(
      "📍 ROUTE COORDINATES:",
      coords
    );


    if (
      !Array.isArray(coords) ||
      coords.length < 2
    ) {

      console.log(
        "⏳ Waiting for TrafficAgent route..."
      );

      return;
    }


    console.log(
      "🚦 REAL TRAFFIC ROUTE RECEIVED"
    );


    drawAgentRoute(
      coords
    );


  }, [
    data?.map?.coordinates
  ]);


  // =========================================================
  // DRAW TRAFFIC AGENT ROUTE
  // =========================================================

  const drawAgentRoute =
    async (coords) => {

      const map =
        mapRef.current;


      if (!map) {
        return;
      }


      console.log(
        "🚦 Drawing route from TrafficAgent"
      );


      const formatted =
        coords
          .map(
            (point) => [

              Number(point.lng),

              Number(point.lat)

            ]
          )
          .filter(
            ([lng, lat]) =>
              Number.isFinite(lng) &&
              Number.isFinite(lat)
          );


      if (
        formatted.length < 2
      ) {

        console.log(
          "⚠️ Invalid route coordinates"
        );

        return;
      }


      try {
  const response = await API.post("/route", { coordinates: formatted });
  const geojson = response.data;
  drawRoute(geojson, coords);
} catch (error) {
  console.error("❌ Route API Error:", error);
}

    };


  // =========================================================
  // DRAW ORS ROUTE
  // =========================================================

  const drawRoute =
    (
      geojson,
      coords
    ) => {

      const map =
        mapRef.current;


      if (!map) {
        return;
      }


      if (
        !geojson?.features?.length
      ) {

        console.log(
          "⚠️ ORS returned no route"
        );

        return;
      }


      // =====================================================
      // REMOVE OLD ROUTE
      // =====================================================

      if (
        map.getLayer("route")
      ) {

        map.removeLayer(
          "route"
        );

      }


      if (
        map.getSource("route")
      ) {

        map.removeSource(
          "route"
        );

      }


      // =====================================================
      // ADD ROUTE
      // =====================================================

      map.addSource(
        "route",
        {

          type:
            "geojson",

          data:
            geojson

        }
      );


      map.addLayer({

        id:
          "route",

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
            "#00e5ff",

          "line-width":
            6,

          "line-opacity":
            0.9

        }

      });


      // =====================================================
      // REMOVE OLD ROUTE MARKERS
      // =====================================================

      document
        .querySelectorAll(
          ".route-marker"
        )
        .forEach(
          (element) => {

            element.remove();

          }
        );


      // =====================================================
      // ADD ROUTE POINTS
      // =====================================================

      coords.forEach(
        (point) => {

          const markerEl =
            document.createElement(
              "div"
            );


          markerEl.className =
            "route-marker";


          markerEl.style.width =
            "16px";

          markerEl.style.height =
            "16px";

          markerEl.style.borderRadius =
            "50%";

          markerEl.style.background =
            "#00e5ff";

          markerEl.style.border =
            "2px solid white";

          markerEl.style.boxShadow =
            "0 0 12px rgba(0,229,255,0.9)";


          (() => {
  const el = markerEl; // already styled element
  const popup = (() => {
    const p = document.createElement("div");
    const strong = document.createElement("strong");
    strong.textContent = point.zone || "Route Point";
    p.appendChild(strong);
    return new maplibregl.Popup().setDOMContent(p);
  })();

  return new maplibregl.Marker(el)
    .setLngLat([Number(point.lng), Number(point.lat)])
    .setPopup(popup)
    .addTo(map);
})();

        }
      );


      // =====================================================
      // AMBULANCE
      // =====================================================

      animateAmbulance(
        geojson
      );

    };


  // =========================================================
  // AMBULANCE
  // =========================================================

  const animateAmbulance =
    (geojson) => {

      const map =
        mapRef.current;


      const geometry =
        geojson
          ?.features?.[0]
          ?.geometry;


      if (
        !map ||
        !geometry ||
        !Array.isArray(
          geometry.coordinates
        )
      ) {

        return;
      }


      const routeCoordinates =
        geometry.coordinates;


      // Stop previous animation

      if (
        ambulanceIntervalRef.current
      ) {

        clearInterval(
          ambulanceIntervalRef.current
        );

      }


      // Remove old ambulance

      if (
        ambulanceRef.current
      ) {

        ambulanceRef.current.remove();

      }


      // =====================================================
      // AMBULANCE
      // =====================================================

      const ambulanceEl =
        document.createElement(
          "div"
        );


      ambulanceEl.textContent = "🚑";


      ambulanceEl.style.fontSize =
        "30px";

      ambulanceEl.style.filter =
        "drop-shadow(0 0 8px rgba(255,255,255,0.9))";


      ambulanceRef.current =
        new maplibregl.Marker({

          element:
            ambulanceEl

        })

          .setLngLat(
            routeCoordinates[0]
          )

          .addTo(map);


      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let index = 0;
  ambulanceIntervalRef.current = setInterval(() => {
    if (index >= routeCoordinates.length) {
      clearInterval(ambulanceIntervalRef.current);
      return;
    }
    ambulanceRef.current?.setLngLat(routeCoordinates[index]);
    index++;
  }, 100);
} else {
  // Reduced motion: place ambulance at final position without animation
  ambulanceRef.current?.setLngLat(routeCoordinates[routeCoordinates.length - 1]);
}

    };


  // =========================================================
  // CLEANUP
  // =========================================================

  useEffect(() => {

    return () => {

      if (
        ambulanceIntervalRef.current
      ) {

        clearInterval(
          ambulanceIntervalRef.current
        );

      }


      if (
        disasterMarkerRef.current
      ) {

        disasterMarkerRef.current.remove();

        disasterMarkerRef.current = null;

      }


      if (
        ambulanceRef.current
      ) {

        ambulanceRef.current.remove();

        ambulanceRef.current = null;

      }


      if (
        mapRef.current
      ) {

        mapRef.current.remove();

        mapRef.current = null;

      }

    };

  }, []);


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
          h-[550px]
        "
      >
        {mapError ? (
          <div className="p-4 text-center text-red-500">
            Map cannot be displayed – missing MapTiler API key.
          </div>
        ) : (
          <>
            {isMapLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12" />
              </div>
            )}
            <div
              ref={mapContainer}
              className="w-full h-[462px]"
            />
          </>
        )}


      {/* HEADER */}

      <div
        className="
          p-4
          border-b
          border-slate-800
          bg-slate-950
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

          <div>

            <h2
              className="
                text-2xl
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

              {
                data?.scenario?.name ||
                data?.map?.affectedArea ||
                "Monitoring active disaster"
              }

              {" • "}

              {
                data?.scenario?.location ||
                data?.map?.location ||
                "Waiting for location"
              }

            </p>

          </div>


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


      {/* MAP */}

      <div
        ref={mapContainer}
        className="
          w-full
          h-[462px]
        "
      />

    </div>

  );

}