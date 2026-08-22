import { useState, useEffect } from "react";
import axios from "axios";

import Navbar from "../components/Navbar";
import DisasterInputPanel from "../components/DisasterInputPanel";
import WelcomeScreen from "../components/WelcomeScreen";
import AnalysisScreen from "../components/AnalysisScreen";
import ResponseView from "../components/ResponseView";
import IncidentQueue from "../components/IncidentQueue";
import AdminCommandCenter from "../components/AdminCommandCenter";

import useDashboardData from "../hooks/useDashboardData";
import useGeolocation from "../hooks/useGeolocation";

export default function Dashboard() {
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
  // SCREEN STATE
  // ============================================================

  const [currentStep, setCurrentStep] = useState("welcome");

  // Possible states:
  // welcome
  // reporting
  // analyzing
  // response
  // admin          ← new: incident queue
  // admin-incident ← new: command center for a specific incident

  const [adminIncident, setAdminIncident] = useState(null);

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
  // WELCOME SCREEN
  // ============================================================

  if (currentStep === "welcome") {
    return (
      <WelcomeScreen
        onBegin={() =>
          setCurrentStep("reporting")
        }
        onAdmin={() => setCurrentStep("admin")}
      />
    );
  }

  // ============================================================
  // ANALYZING SCREEN
  // ============================================================

  if (currentStep === "analyzing") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar onAdmin={() => setCurrentStep("admin")} />

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
        <Navbar onAdmin={() => setCurrentStep("admin")} />

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
  // ADMIN — INCIDENT QUEUE
  // ============================================================

  if (currentStep === "admin") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar onAdmin={() => setCurrentStep("admin")} />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
          <div className="mb-6">
            <button
              type="button"
              onClick={() => setCurrentStep("welcome")}
              className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 transition font-mono uppercase tracking-wider cursor-pointer"
            >
              ← Back to Home
            </button>
          </div>
          <IncidentQueue
            onOpenIncident={(incident) => {
              setAdminIncident(incident);
              setCurrentStep("admin-incident");
            }}
          />
        </main>
      </div>
    );
  }

  // ============================================================
  // ADMIN — INCIDENT COMMAND CENTER
  // ============================================================

  if (currentStep === "admin-incident" && adminIncident) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar onAdmin={() => setCurrentStep("admin")} />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
          <AdminCommandCenter
            incident={adminIncident}
            onBack={() => setCurrentStep("admin")}
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
        <Navbar onAdmin={() => setCurrentStep("admin")} />

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