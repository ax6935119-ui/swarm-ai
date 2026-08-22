import { useState, useEffect } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";
import DisasterInputPanel from "../components/DisasterInputPanel";
import WelcomeScreen from "../components/WelcomeScreen";
import AnalysisScreen from "../components/AnalysisScreen";
import ResponseView from "../components/ResponseView";
import IncidentQueue from "../components/IncidentQueue";
import AdminCommandCenter from "../components/AdminCommandCenter";
import AdminLogin from "../components/AdminLogin";

import useDashboardData from "../hooks/useDashboardData";
import useGeolocation from "../hooks/useGeolocation";
import { getAdminSession, logoutAdmin } from "../services/adminService";

export default function Dashboard() {
  // ============================================================
  // ADMIN AUTHENTICATION STATE
  // ============================================================

  const [adminSession, setAdminSession] = useState(() => getAdminSession());

  // ============================================================
  // DASHBOARD / BACKEND STATE
  // ============================================================

  const {
    dashboardData,
    loading,
    error,
  } = useDashboardData();

  // ============================================================
  // GEOLOCATION
  // ============================================================

  const { coords: geoCoords } = useGeolocation({
    auto: true,
  });

  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (geoCoords?.lat && geoCoords?.lng) {
      setUserLocation({
        lat: geoCoords.lat,
        lng: geoCoords.lng,
      });
    }
  }, [geoCoords]);

  const handleLocationDetected = (loc) => {
    if (!loc) return;

    setUserLocation({
      lat: loc.lat,
      lng: loc.lng,
    });
  };

  // ============================================================
  // SCREEN & ROUTE STATE
  // ============================================================

  const [currentStep, setCurrentStep] = useState("welcome");

  // Possible states:
  // welcome
  // reporting
  // analyzing
  // response
  // admin          ← Incident Queue (protected)
  // admin-incident ← Incident Command Center (protected)

  const [adminIncident, setAdminIncident] = useState(null);

  // Synchronize route with URL (/admin or #/admin)
  useEffect(() => {
    const syncRouteFromURL = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (
        path === "/admin" ||
        path === "/admin/" ||
        path.startsWith("/admin/") ||
        hash === "#/admin" ||
        hash === "#admin"
      ) {
        setCurrentStep("admin");
      }
    };

    syncRouteFromURL();

    window.addEventListener("popstate", syncRouteFromURL);
    window.addEventListener("hashchange", syncRouteFromURL);

    return () => {
      window.removeEventListener("popstate", syncRouteFromURL);
      window.removeEventListener("hashchange", syncRouteFromURL);
    };
  }, []);

  const navigateToHome = () => {
    try {
      window.history.pushState(null, "", "/");
    } catch {
      window.location.hash = "";
    }
    setCurrentStep("welcome");
  };

  const handleLoginSuccess = () => {
    setAdminSession(getAdminSession());
    setCurrentStep("admin");
  };

  const handleLogout = () => {
    logoutAdmin();
    setAdminSession(null);
    setAdminIncident(null);
    try {
      window.history.pushState(null, "", "/");
    } catch {
      window.location.hash = "";
    }
    setCurrentStep("welcome");
  };

  // ============================================================
  // DISASTER STATE
  // ============================================================

  const [analyzingDisaster, setAnalyzingDisaster] =
    useState(false);

  const [disasterInput, setDisasterInput] =
    useState(null);

  const [disasterAnalysis, setDisasterAnalysis] =
    useState(null);

  const [apiError, setApiError] =
    useState(null);

  // ============================================================
  // ANALYZE DISASTER
  // ============================================================

  const handleDisasterAnalyze = async (input) => {
    console.log("🚨 DISASTER INPUT:", input);

    // ==========================================================
    // VALIDATE LOCATION
    // ==========================================================

    if (!input?.location?.trim()) {
      setApiError(
        "Please enter the disaster location."
      );
      return;
    }

    // ==========================================================
    // VALIDATE IMAGES
    // ==========================================================

    if (
      !input?.images ||
      input.images.length === 0
    ) {
      setApiError(
        "Please upload or capture at least one disaster image."
      );
      return;
    }

    // ==========================================================
    // RESET STATE
    // ==========================================================

    setDisasterInput(input);
    setAnalyzingDisaster(true);
    setDisasterAnalysis(null);
    setApiError(null);

    setCurrentStep("analyzing");

    try {
      // ========================================================
      // CREATE FORM DATA
      // ========================================================

      const formData = new FormData();

      formData.append(
        "location",
        input.location.trim()
      );

      formData.append(
        "description",
        input.description?.trim() || ""
      );

      if (input.disasterType) {
        formData.append(
          "disaster_type",
          input.disasterType
        );
        formData.append(
          "disasterType",
          input.disasterType
        );
      }

      // Backend expects:
      // images: list[UploadFile]
      //
      // Therefore all images must use
      // the same field name: "images"

      input.images.forEach((image) => {
        formData.append(
          "images",
          image
        );
      });

      console.log(
        "📤 Sending disaster analysis request..."
      );

      console.log(
        "📍 Location:",
        input.location
      );

      console.log(
        "📝 Description:",
        input.description
      );

      console.log(
        "📷 Images:",
        input.images.map((image) => ({
          name: image.name,
          type: image.type,
          size: image.size,
        }))
      );

      // ========================================================
      // BACKEND URL
      // ========================================================

      const baseURL =
        import.meta.env.VITE_BACKEND_URL ||
        "http://127.0.0.1:8000";

      // ========================================================
      // API REQUEST
      // ========================================================

      const response = await axios.post(
        `${baseURL}/disaster/analyze`,
        formData,
        {
          timeout: 180000,
        }
      );

      console.log(
        "✅ DISASTER RESPONSE:",
        response.data
      );

      // ========================================================
      // VALIDATE RESPONSE
      // ========================================================

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
          "Backend returned an unsuccessful response."
        );
      }

      // ========================================================
      // STORE RESPONSE
      // ========================================================

      setDisasterAnalysis(
        response.data
      );

      setCurrentStep(
        "response"
      );

      console.log(
        "✅ Disaster analysis completed."
      );
    } catch (err) {
      console.error(
        "❌ Disaster analysis failed:",
        err
      );

      // ========================================================
      // BACKEND ERROR
      // ========================================================

      if (err.response) {
        console.error(
          "Status:",
          err.response.status
        );

        console.error(
          "Response:",
          err.response.data
        );

        const detail =
          err.response.data?.detail;

        if (
          typeof detail === "object" &&
          detail !== null
        ) {
          setApiError(
            detail.message ||
            err.response.data?.message ||
            "The submitted incident could not be processed."
          );
        } else {
          setApiError(
            detail ||
            err.response.data?.message ||
            "Backend failed to analyze the incident."
          );
        }
      }

      // ========================================================
      // CONNECTION ERROR
      // ========================================================

      else if (err.request) {
        setApiError(
          "Unable to connect to the backend. Make sure FastAPI is running on port 8000."
        );
      }

      // ========================================================
      // OTHER ERROR
      // ========================================================

      else {
        setApiError(
          err.message ||
          "An unexpected error occurred."
        );
      }

      // Go back to reporting screen
      setCurrentStep(
        "reporting"
      );
    } finally {
      setAnalyzingDisaster(
        false
      );
    }
  };

  // ============================================================
  // RESET
  // ============================================================

  const handleReset = () => {
    setDisasterAnalysis(null);
    setDisasterInput(null);
    setApiError(null);
    setAnalyzingDisaster(false);

    setCurrentStep(
      "reporting"
    );
  };

  // ============================================================
  // ADMIN PORTAL (PROTECTED)
  // ============================================================

  if (currentStep === "admin" || currentStep === "admin-incident") {
    // If unauthenticated -> show login
    if (!adminSession) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
          <Navbar onHome={navigateToHome} />
          <main className="flex-1 flex flex-col justify-center">
            <AdminLogin
              onLoginSuccess={handleLoginSuccess}
              onBackToCitizen={navigateToHome}
            />
          </main>
        </div>
      );
    }

    // If authenticated -> show Command Center or Queue
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          isAdminAuthenticated={true}
          onLogout={handleLogout}
          onHome={navigateToHome}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
          {currentStep === "admin-incident" && adminIncident ? (
            <AdminCommandCenter
              incident={adminIncident}
              onBack={() => setCurrentStep("admin")}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={navigateToHome}
                  className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition font-mono uppercase tracking-wider cursor-pointer"
                >
                  ← Citizen Emergency Portal
                </button>
              </div>

              <IncidentQueue
                onOpenIncident={(incident) => {
                  setAdminIncident(incident);
                  setCurrentStep("admin-incident");
                }}
              />
            </div>
          )}
        </main>
      </div>
    );
  }

  // ============================================================
  // WELCOME SCREEN
  // ============================================================

  if (currentStep === "welcome") {
    return (
      <WelcomeScreen
        onBegin={() =>
          setCurrentStep("reporting")
        }
      />
    );
  }

  // ============================================================
  // ANALYZING SCREEN
  // ============================================================

  if (currentStep === "analyzing") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          isAdminAuthenticated={!!adminSession}
          onLogout={handleLogout}
          onHome={navigateToHome}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
          <AnalysisScreen
            location={
              disasterInput?.location || ""
            }
          />
        </main>
      </div>
    );
  }

  // ============================================================
  // RESPONSE SCREEN
  // ============================================================

  if (
    currentStep === "response" &&
    disasterAnalysis
  ) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          isAdminAuthenticated={!!adminSession}
          onLogout={handleLogout}
          onHome={navigateToHome}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
          <ResponseView
            data={disasterAnalysis}
            onReset={handleReset}
            userLocation={userLocation}
          />
        </main>
      </div>
    );
  }

  // ============================================================
  // REPORTING SCREEN
  // ============================================================

  if (currentStep === "reporting") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar
          isAdminAuthenticated={!!adminSession}
          onLogout={handleLogout}
          onHome={navigateToHome}
        />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center">
          <DisasterInputPanel
            onAnalyze={handleDisasterAnalyze}
            loading={analyzingDisaster}
            apiError={apiError}
            initialValues={disasterInput}
            onLocationDetected={
              handleLocationDetected
            }
          />
        </main>
      </div>
    );
  }

  // ============================================================
  // FALLBACK LOADING
  // ============================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        Loading SwarmAI...
      </div>
    );
  }

  // ============================================================
  // CONNECTION ERROR
  // ============================================================

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-red-400 gap-3">
        <h2 className="text-xl font-bold">
          Backend Connection Failed
        </h2>

        <p className="text-sm text-slate-400">
          {error?.message ||
            "Unable to connect to the backend."}
        </p>

        <button
          onClick={() =>
            setCurrentStep("reporting")
          }
          className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition"
        >
          Continue Anyway
        </button>
      </div>
    );
  }

  return null;
}