import { useState } from "react";

import Navbar from "../components/Navbar";
import StatsCards from "../components/StatsCards";
import AgentCards from "../components/AgentCards";
import LogsPanel from "../components/LogsPanel";
import MapDashboard from "../components/MapDashboard";
import ReasoningPanel from "../components/ReasoningPanel";
import AgentCommunicationPanel from "../components/AgentCommunicationPanel";
import DisasterInputPanel from "../components/DisasterInputPanel";
import WelcomeScreen from "../components/WelcomeScreen";
import AnalysisScreen from "../components/AnalysisScreen";
import ResponseView from "../components/ResponseView";

import useDashboardData from "../hooks/useDashboardData";

import axios from "axios";


export default function Dashboard() {

  const {
    dashboardData,
    loading,
    error,
  } = useDashboardData();


  // ============================================================
  // SCREEN / STAGE STATE
  // ============================================================

  const [currentStep, setCurrentStep] = useState("welcome"); // "welcome" | "reporting"

  // ============================================================
  // DISASTER ANALYSIS STATE
  // ============================================================

  const [
    analyzingDisaster,
    setAnalyzingDisaster,
  ] = useState(false);


  const [
    disasterInput,
    setDisasterInput,
  ] = useState(null);


  const [
    disasterAnalysis,
    setDisasterAnalysis,
  ] = useState(null);

  const [
    apiError,
    setApiError,
  ] = useState(null);


  // ============================================================
  // ANALYZE DISASTER
  // ============================================================

  const handleDisasterAnalyze = async (input) => {

    console.log(
      "DISASTER INPUT RECEIVED:",
      input
    );


    // ----------------------------------------------------------
    // VALIDATION
    // ----------------------------------------------------------

    if (!input?.location?.trim()) {

      alert(
        "Please enter the disaster location."
      );

      return;

    }


    if (!input?.image) {

      alert(
        "Please upload a disaster image."
      );

      return;

    }


    // ----------------------------------------------------------
    // START ANALYSIS
    // ----------------------------------------------------------

    setDisasterInput(input);

    setAnalyzingDisaster(true);

    setDisasterAnalysis(null);

    setApiError(null);

    setCurrentStep("analyzing");


    try {

      // ========================================================
      // FORM DATA
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


      formData.append(
        "image",
        input.image
      );


      console.log(
        "Sending disaster input to backend..."
      );

      console.log(
        "Location:",
        input.location
      );

      console.log(
        "Description:",
        input.description
      );

      console.log(
        "Image:",
        input.image.name
      );


      // ========================================================
      // BACKEND REQUEST
      // ========================================================

      const baseURL =
        import.meta.env.VITE_BACKEND_URL ||
        "http://127.0.0.1:8000";

      const response = await axios.post(

        `${baseURL}/disaster/analyze`,

        formData,

        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },

          timeout: 120000,

        }

      );


      console.log(
        "DISASTER ANALYSIS RESPONSE:",
        response.data
      );


      // ========================================================
      // VALIDATE RESPONSE
      // ========================================================

      if (!response.data?.success) {

        throw new Error(
          "Backend returned an unsuccessful response."
        );

      }


      // ========================================================
      // STORE RESULTS
      // ========================================================

      setDisasterAnalysis(
        response.data
      );

      setCurrentStep("response");


      console.log(
        "Disaster analysis completed successfully."
      );


    }

    catch (err) {

      console.error(
        "Disaster analysis failed:",
        err
      );


      // --------------------------------------------------------
      // BACKEND ERROR
      // --------------------------------------------------------

      if (err.response) {

        console.error(
          "Backend status:",
          err.response.status
        );


        console.error(
          "Backend response:",
          err.response.data
        );


        setApiError(
          err.response.data?.detail ||
          "Backend failed to analyze the incident."
        );

      }


      // --------------------------------------------------------
      // CONNECTION ERROR
      // --------------------------------------------------------

      else if (err.request) {

        setApiError(
          "Unable to connect to the backend server. Ensure FastAPI is running on port 8000."
        );

      }


      // --------------------------------------------------------
      // OTHER ERROR
      // --------------------------------------------------------

      else {

        setApiError(
          err.message ||
          "An unexpected error occurred during incident analysis."
        );

      }

      setCurrentStep("reporting");

    }

    finally {

      setAnalyzingDisaster(
        false
      );

    }

  };


  // ============================================================
  // RESET / REPORT ANOTHER INCIDENT
  // ============================================================

  const handleReset = () => {
    setDisasterAnalysis(null);
    setDisasterInput(null);
    setApiError(null);
    setCurrentStep("reporting");
  };


  // ============================================================
  // WELCOME SCREEN
  // ============================================================

  if (currentStep === "welcome") {
    return (
      <WelcomeScreen
        onBegin={() => setCurrentStep("reporting")}
      />
    );
  }


  // ============================================================
  // ANALYSIS SCREEN
  // ============================================================

  if (currentStep === "analyzing") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center my-auto">
          <AnalysisScreen
            location={disasterInput?.location || ""}
          />
        </main>
      </div>
    );
  }


  // ============================================================
  // ACTIONABLE RESPONSE VIEW
  // ============================================================

  if (currentStep === "response" && disasterAnalysis) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8">
          <ResponseView
            data={disasterAnalysis}
            onReset={handleReset}
          />
        </main>
      </div>
    );
  }


  // ============================================================
  // REPORTING VIEW
  // ============================================================

  if (currentStep === "reporting") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col justify-center my-auto">
          <DisasterInputPanel
            onAnalyze={handleDisasterAnalyze}
            loading={analyzingDisaster}
            apiError={apiError}
            initialValues={disasterInput}
          />
        </main>
      </div>
    );
  }


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {

    return (

      <div className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-100
      ">

        <div className="
          text-2xl
          font-bold
          text-slate-700
        ">

          Loading SwarmAI Dashboard...

        </div>

      </div>

    );

  }


  // ============================================================
  // ERROR
  // ============================================================

  if (error) {

    return (

      <div className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-red-50
      ">

        <div className="
          bg-white
          p-8
          rounded-2xl
          shadow-xl
          border
          border-red-200
        ">

          <h2 className="
            text-2xl
            font-bold
            text-red-600
            mb-3
          ">

            Backend Connection Failed

          </h2>


          <p className="
            text-slate-600
          ">

            Ensure FastAPI backend is running on port 8000.

          </p>

        </div>

      </div>

    );

  }


  // ============================================================
  // DASHBOARD
  // ============================================================

  return (

    <div className="
      min-h-screen
      bg-slate-100
    ">

      <Navbar />


      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="
        flex
        flex-col
        lg:flex-row
        lg:items-center
        lg:justify-between
        gap-4
        px-6
        pt-6
      ">

        <div>

          <h1 className="
            text-3xl
            font-bold
            text-slate-800
          ">

            SwarmAI Disaster Dashboard

          </h1>


          <p className="
            text-slate-500
            mt-1
          ">

            AI-powered multi-agent emergency coordination system

          </p>

        </div>


        {/* ==================================================
            SYSTEM STATUS
        =================================================== */}

        <div className="
          flex
          items-center
          gap-2
          bg-white
          px-4
          py-2
          rounded-xl
          shadow
        ">

          <div className="
            w-3
            h-3
            rounded-full
            bg-green-500
            animate-pulse
          " />

          <span className="
            text-sm
            font-semibold
            text-slate-700
          ">

            SYSTEM ACTIVE

          </span>

        </div>

      </div>


      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <div className="
        p-6
        space-y-6
      ">


        {/* ====================================================
            DISASTER INPUT
        ===================================================== */}

        <DisasterInputPanel

          onAnalyze={
            handleDisasterAnalyze
          }

          loading={
            analyzingDisaster
          }

        />


        {/* ====================================================
            INPUT CONFIRMATION
        ===================================================== */}

        {disasterInput && (

          <div className="
            bg-blue-50
            border
            border-blue-200
            rounded-2xl
            p-5
          ">

            <h3 className="
              font-bold
              text-blue-800
              mb-2
            ">

              Disaster Input Captured

            </h3>


            <p className="
              text-sm
              text-blue-700
            ">

              <strong>
                Location:
              </strong>

              {" "}

              {disasterInput.location}

            </p>


            {disasterInput.description && (

              <p className="
                text-sm
                text-blue-700
                mt-1
              ">

                <strong>
                  Description:
                </strong>

                {" "}

                {disasterInput.description}

              </p>

            )}


            {disasterInput.image && (

              <p className="
                text-sm
                text-green-700
                mt-1
                font-medium
              ">

                Image uploaded:

                {" "}

                {disasterInput.image.name}

              </p>

            )}

          </div>

        )}


        {/* ====================================================
            AI DISASTER ASSESSMENT
        ===================================================== */}

        {disasterAnalysis?.event && (

          <div className="
            bg-white
            border
            border-slate-200
            rounded-2xl
            shadow-lg
            p-6
          ">

            <div className="
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-3
              mb-5
            ">

              <div>

                <h2 className="
                  text-xl
                  font-bold
                  text-slate-800
                ">

                  AI Disaster Assessment

                </h2>


                <p className="
                  text-sm
                  text-slate-500
                  mt-1
                ">

                  Dynamic analysis generated from the submitted incident data.

                </p>

              </div>


              <div className="
                px-4
                py-2
                rounded-xl
                bg-red-50
                border
                border-red-200
              ">

                <span className="
                  text-sm
                  font-bold
                  text-red-600
                ">

                  Severity:{" "}
                  {disasterAnalysis.event.severity}
                  /10

                </span>

              </div>

            </div>


            {/* ==================================================
                BASIC DETAILS
            =================================================== */}

            <div className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-4
              mb-5
            ">


              <div className="
                bg-slate-50
                rounded-xl
                p-4
              ">

                <p className="
                  text-xs
                  text-slate-500
                  mb-1
                ">

                  Disaster Type

                </p>


                <p className="
                  font-bold
                  text-slate-800
                ">

                  {disasterAnalysis.event.disaster_type ||
                    "Unknown"}

                </p>

              </div>


              <div className="
                bg-slate-50
                rounded-xl
                p-4
              ">

                <p className="
                  text-xs
                  text-slate-500
                  mb-1
                ">

                  Confidence

                </p>


                <p className="
                  font-bold
                  text-slate-800
                ">

                  {(
                    Number(
                      disasterAnalysis.event.confidence || 0
                    ) * 100
                  ).toFixed(1)}

                  %

                </p>

              </div>


              <div className="
                bg-slate-50
                rounded-xl
                p-4
              ">

                <p className="
                  text-xs
                  text-slate-500
                  mb-1
                ">

                  Evacuation

                </p>


                <p className="
                  font-bold
                  text-slate-800
                ">

                  {
                    disasterAnalysis.event
                      .evacuation_required

                      ? "Required"

                      : "Not Required"
                  }

                </p>

              </div>

            </div>


            {/* ==================================================
                SUMMARY
            =================================================== */}

            {disasterAnalysis.event.summary && (

              <div className="
                mb-5
              ">

                <h3 className="
                  font-semibold
                  text-slate-700
                  mb-2
                ">

                  AI Summary

                </h3>


                <p className="
                  text-sm
                  text-slate-600
                  leading-relaxed
                ">

                  {disasterAnalysis.event.summary}

                </p>

              </div>

            )}


            {/* ==================================================
                OBSERVATIONS
            =================================================== */}

            {Array.isArray(
              disasterAnalysis.event.observations
            ) &&

            disasterAnalysis.event.observations.length > 0 && (

              <div className="
                mb-5
              ">

                <h3 className="
                  font-semibold
                  text-slate-700
                  mb-2
                ">

                  AI Observations

                </h3>


                <ul className="
                  list-disc
                  pl-5
                  space-y-1
                  text-sm
                  text-slate-600
                ">

                  {disasterAnalysis.event.observations.map(
                    (observation, index) => (

                      <li key={index}>

                        {observation}

                      </li>

                    )
                  )}

                </ul>

              </div>

            )}


            {/* ==================================================
                HAZARDS
            =================================================== */}

            {Array.isArray(
              disasterAnalysis.event.hazards
            ) &&

            disasterAnalysis.event.hazards.length > 0 && (

              <div>

                <h3 className="
                  font-semibold
                  text-slate-700
                  mb-2
                ">

                  Detected Hazards

                </h3>


                <div className="
                  flex
                  flex-wrap
                  gap-2
                ">

                  {disasterAnalysis.event.hazards.map(
                    (hazard, index) => (

                      <span
                        key={index}
                        className="
                          px-3
                          py-1
                          rounded-full
                          bg-red-50
                          text-red-700
                          text-xs
                          font-semibold
                          border
                          border-red-200
                        "
                      >

                        {hazard}

                      </span>

                    )
                  )}

                </div>

              </div>

            )}

          </div>

        )}


        {/* ====================================================
            STATS
        ===================================================== */}

        <StatsCards
          data={dashboardData}
        />


        {/* ====================================================
            MAP + LOGS
        ===================================================== */}

        <div className="
          grid
          grid-cols-1
          xl:grid-cols-3
          gap-6
        ">


          <div className="
            xl:col-span-2
          ">

            <MapDashboard
              data={dashboardData}
            />

          </div>


          <div>

            <LogsPanel
              data={dashboardData}
            />

          </div>

        </div>


        {/* ====================================================
            AGENT COORDINATION
        ===================================================== */}

        <div>

          <div className="
            flex
            items-center
            justify-between
            mb-4
          ">

            <h2 className="
              text-2xl
              font-bold
              text-slate-800
            ">

              AI Agent Coordination

            </h2>


            <span className="
              text-sm
              text-slate-500
              bg-white
              px-3
              py-1
              rounded-lg
              shadow-sm
            ">

              LangGraph Orchestrated

            </span>

          </div>


          <AgentCards
            data={dashboardData}
          />

        </div>


        {/* ====================================================
            AI REASONING
        ===================================================== */}

        <ReasoningPanel
          agents={
            dashboardData?.agents
          }
        />


        {/* ====================================================
            AGENT COMMUNICATION
        ===================================================== */}

        <AgentCommunicationPanel
          data={
            dashboardData
          }
        />

      </div>

    </div>

  );

}