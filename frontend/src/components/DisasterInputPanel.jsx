import { useState } from "react";

export default function DisasterInputPanel({
  onAnalyze,
  loading = false,
}) {
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!location.trim()) {
      alert("Please enter the disaster location.");
      return;
    }

    onAnalyze({
      location: location.trim(),
      description: description.trim(),
      image,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">
          🚨 Create Disaster Event
        </h2>

        <p className="text-sm text-slate-500 mt-1">
          Provide incident details and let SwarmAI analyze the situation.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5"
      >

        {/* LOCATION */}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            📍 Disaster Location
          </label>

          <input
            type="text"
            value={location}
            onChange={(e) =>
              setLocation(e.target.value)
            }
            placeholder="e.g. Pune, Maharashtra"
            className="
              w-full
              px-4
              py-3
              rounded-xl
              border
              border-slate-300
              focus:outline-none
              focus:ring-2
              focus:ring-red-500
            "
          />
        </div>

        {/* DESCRIPTION */}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            📝 Incident Description
          </label>

          <textarea
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows={4}
            placeholder="Describe what is happening..."
            className="
              w-full
              px-4
              py-3
              rounded-xl
              border
              border-slate-300
              resize-none
              focus:outline-none
              focus:ring-2
              focus:ring-red-500
            "
          />
        </div>

        {/* IMAGE */}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            📷 Disaster Image
          </label>

          <div className="
            border-2
            border-dashed
            border-slate-300
            rounded-xl
            p-6
            text-center
            hover:border-red-400
            transition
          ">

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(
                  e.target.files?.[0] || null
                )
              }
              className="w-full"
            />

            {image && (
              <p className="
                text-sm
                text-green-600
                mt-3
                font-medium
              ">
                ✅ {image.name}
              </p>
            )}

          </div>
        </div>

        {/* BUTTON */}

        <button
          type="submit"
          disabled={loading}
          className={`
            w-full
            py-3
            rounded-xl
            font-semibold
            text-white
            shadow-lg
            transition

            ${
              loading
                ? "bg-slate-400 cursor-not-allowed"
                : `
                  bg-red-600
                  hover:bg-red-700
                  hover:scale-[1.01]
                `
            }
          `}
        >

          {loading
            ? "🔄 Analyzing Disaster..."
            : "🔍 Analyze & Start Response"}

        </button>

      </form>

    </div>
  );
}