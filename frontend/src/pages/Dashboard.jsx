import { useState } from "react";

import Navbar from "../components/Navbar";

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
  // SCREEN STATE
  // ============================================================

  const [
    currentStep,
    setCurrentStep,
  ] = useState(
    "welcome"
  );


  // ============================================================
  // DISASTER STATE
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

  const handleDisasterAnalyze =
    async (input) => {

      console.log(
        "🚨 DISASTER INPUT:",
        input
      );


      // ========================================================
      // VALIDATE LOCATION
      // ========================================================

      if (
        !input?.location?.trim()
      ) {

        setApiError(
          "Please enter the disaster location."
        );

        return;

      }


      // ========================================================
      // VALIDATE IMAGES
      // ========================================================

      if (
        !input?.images ||
        input.images.length === 0
      ) {

        setApiError(
          "Please upload or capture at least one disaster image."
        );

        return;

      }


      // ========================================================
      // RESET STATE
      // ========================================================

      setDisasterInput(
        input
      );

      setAnalyzingDisaster(
        true
      );

      setDisasterAnalysis(
        null
      );

      setApiError(
        null
      );

      setCurrentStep(
        "analyzing"
      );


      try {

        // ======================================================
        // CREATE FORM DATA
        // ======================================================

        const formData =
          new FormData();


        formData.append(

          "location",

          input.location.trim()

        );


        formData.append(

          "description",

          input.description?.trim() || ""

        );


        // ======================================================
        // IMPORTANT
        //
        // Backend expects:
        //
        // images: list[UploadFile]
        //
        // Therefore every image uses the SAME
        // field name "images".
        // ======================================================

        input.images.forEach(
          (image) => {

            formData.append(

              "images",

              image

            );

          }
        );


        console.log(
          "📤 Sending disaster request..."
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
          input.images.map(
            (image) => ({
              name:
                image.name,

              type:
                image.type,

              size:
                image.size,
            })
          )
        );


        // ======================================================
        // BACKEND URL
        // ======================================================

        const baseURL =

          import.meta.env
            .VITE_BACKEND_URL

          ||

          "http://127.0.0.1:8000";


        // ======================================================
        // API REQUEST
        //
        // Do NOT manually set Content-Type.
        // Browser automatically adds multipart boundary.
        // ======================================================

        const response =
          await axios.post(

            `${baseURL}/disaster/analyze`,

            formData,

            {

              timeout:
                180000,

            }

          );


        console.log(
          "✅ DISASTER RESPONSE:",
          response.data
        );


        // ======================================================
        // VALIDATE RESPONSE
        // ======================================================

        if (
          !response.data?.success
        ) {

          throw new Error(
            "Backend returned an unsuccessful response."
          );

        }


        // ======================================================
        // STORE RESPONSE
        // ======================================================

        setDisasterAnalysis(
          response.data
        );


        setCurrentStep(
          "response"
        );


        console.log(
          "✅ Disaster analysis completed."
        );

      }

      catch (err) {

        console.error(
          "❌ Disaster analysis failed:",
          err
        );


        // ======================================================
        // BACKEND ERROR
        // ======================================================

        if (
          err.response
        ) {

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
            typeof detail ===
            "object"
          ) {

            setApiError(

              detail.message

              ||

              "The submitted incident could not be processed."

            );

          }

          else {

            setApiError(

              detail

              ||

              "Backend failed to analyze the incident."

            );

          }

        }


        // ======================================================
        // CONNECTION ERROR
        // ======================================================

        else if (
          err.request
        ) {

          setApiError(
            "Unable to connect to the backend. Make sure FastAPI is running on port 8000."
          );

        }


        // ======================================================
        // OTHER ERROR
        // ======================================================

        else {

          setApiError(

            err.message

            ||

            "An unexpected error occurred."

          );

        }


        setCurrentStep(
          "reporting"
        );

      }

      finally {

        setAnalyzingDisaster(
          false
        );

      }

    };


  // ============================================================
  // RESET
  // ============================================================

  const handleReset = () => {

    setDisasterAnalysis(
      null
    );

    setDisasterInput(
      null
    );

    setApiError(
      null
    );

    setCurrentStep(
      "reporting"
    );

  };


  // ============================================================
  // WELCOME
  // ============================================================

  if (
    currentStep === "welcome"
  ) {

    return (

      <WelcomeScreen
        onBegin={() =>
          setCurrentStep(
            "reporting"
          )
        }
      />

    );

  }


  // ============================================================
  // ANALYZING
  // ============================================================

  if (
    currentStep === "analyzing"
  ) {

    return (

      <div className="
        min-h-screen
        bg-slate-950
        text-slate-100
        flex
        flex-col
      ">

        <Navbar />


        <main className="
          flex-1
          max-w-5xl
          w-full
          mx-auto
          p-4
          sm:p-8
          flex
          flex-col
          justify-center
        ">

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
  // RESPONSE
  // ============================================================

  if (
    currentStep === "response"

    &&

    disasterAnalysis
  ) {

    return (

      <div className="
        min-h-screen
        bg-slate-950
        text-slate-100
        flex
        flex-col
      ">

        <Navbar />


        <main className="
          flex-1
          max-w-6xl
          w-full
          mx-auto
          p-4
          sm:p-8
        ">

          <ResponseView
            data={
              disasterAnalysis
            }
            onReset={
              handleReset
            }
          />

        </main>

      </div>

    );

  }


  // ============================================================
  // REPORTING
  // ============================================================

  if (
    currentStep === "reporting"
  ) {

    return (

      <div className="
        min-h-screen
        bg-slate-950
        text-slate-100
        flex
        flex-col
      ">

        <Navbar />


        <main className="
          flex-1
          max-w-5xl
          w-full
          mx-auto
          p-4
          sm:p-8
          flex
          flex-col
          justify-center
        ">

          <DisasterInputPanel

            onAnalyze={
              handleDisasterAnalyze
            }

            loading={
              analyzingDisaster
            }

            apiError={
              apiError
            }

            initialValues={
              disasterInput
            }

          />

        </main>

      </div>

    );

  }


  // ============================================================
  // FALLBACK LOADING
  // ============================================================

  if (
    loading
  ) {

    return (

      <div className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-950
        text-white
      ">

        Loading SwarmAI...

      </div>

    );

  }


  // ============================================================
  // CONNECTION ERROR
  // ============================================================

  if (
    error
  ) {

    return (

      <div className="
        min-h-screen
        flex
        items-center
        justify-center
        bg-slate-950
        text-red-400
      ">

        Backend Connection Failed

      </div>

    );

  }


  return null;

}