import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaMapMarkerAlt,
  FaCamera,
  FaFileAlt,
  FaTrashAlt,
  FaExclamationCircle,
  FaCloudUploadAlt,
  FaArrowRight,
  FaSpinner,
} from "react-icons/fa";
import useGeolocation from "../hooks/useGeolocation";

export default function DisasterInputPanel({
  onAnalyze,
  loading = false,
  apiError = null,
  initialValues = null,
  onLocationDetected = null,
}) {
  const [location, setLocation] = useState(initialValues?.location || "");
  const [description, setDescription] = useState(initialValues?.description || "");
  const [image, setImage] = useState(initialValues?.image || null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState({});

  const fileInputRef = useRef(null);

  const { coords, error: geoError, loading: geoLoading, refetch: getGeoLocation } = useGeolocation({ auto: false });
  const [geoLocating, setGeoLocating] = useState(false);
  const [geoAlert, setGeoAlert] = useState(null);

  const reverseGeocode = async (lat, lng) => {
    setGeoLocating(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "SwarmAI-Disaster-System",
          },
        }
      );
      if (!response.ok) {
        throw new Error("Failed to resolve address from coordinates.");
      }
      const data = await response.json();
      const displayName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocation(displayName);
      
      if (errors.location) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next.location;
          return next;
        });
      }

      if (onLocationDetected) {
        onLocationDetected({
          lat,
          lng,
          address: displayName,
        });
      }
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      const coordStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      setLocation(coordStr);
      if (onLocationDetected) {
        onLocationDetected({
          lat,
          lng,
          address: coordStr,
        });
      }
    } finally {
      setGeoLocating(false);
    }
  };

  useEffect(() => {
    if (!geoLocating) return;

    if (coords) {
      setGeoLocating(false);
      reverseGeocode(coords.lat, coords.lng);
    } else if (geoError) {
      setGeoLocating(false);
      setGeoAlert(geoError);
    }
  }, [coords, geoError, geoLocating]);

  const handleUseMyLocation = () => {
    if (loading) return;
    setGeoLocating(true);
    setGeoAlert(null);
    getGeoLocation();
  };

  // Manage preview URL cleanup
  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const validateFile = (file) => {
    if (!file) return "Disaster image is required.";
    if (!file.type || !file.type.startsWith("image/")) {
      return "Uploaded file must be an image (e.g. JPG, PNG, WEBP, etc.).";
    }
    const maxSize = 10 * 1024 * 1024; // 10 MB backend limit
    if (file.size > maxSize) {
      return `Image size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the 10 MB limit.`;
    }
    if (file.size === 0) {
      return "Uploaded image file is empty.";
    }
    return null;
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const fileError = validateFile(file);
    if (fileError) {
      setErrors((prev) => ({ ...prev, image: fileError }));
      setImage(null);
    } else {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.image;
        return next;
      });
      setImage(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImage(null);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.image;
      return next;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = {};

    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      newErrors.location = "Please enter the incident location.";
    }

    const fileError = validateFile(image);
    if (fileError) {
      newErrors.image = fileError;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onAnalyze({
      location: trimmedLocation,
      description: description.trim(),
      image,
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-2xl p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-600/10 border border-red-500/30 text-red-500">
            <FaExclamationCircle className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Report Incident
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Provide incident location and photographic evidence for AI decision intelligence and coordinated response planning.
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Body */}
      <div className="bg-slate-950 border-x border-b border-slate-800 rounded-b-2xl p-6 sm:p-8 shadow-2xl">
        {/* Global API Error Alert */}
        <AnimatePresence>
          {apiError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-300 flex items-start gap-3 text-sm"
              role="alert"
            >
              <FaExclamationCircle className="text-red-400 text-lg mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-red-200">Analysis Request Failed</p>
                <p className="text-red-300/90 mt-0.5">{apiError}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-7" noValidate>
          {/* FIELD 1: LOCATION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="disaster-location"
                className="text-sm font-semibold text-slate-200 flex items-center gap-2"
              >
                <FaMapMarkerAlt className="text-red-500 text-xs" />
                <span>Incident Location</span>
                <span className="text-xs text-red-400 font-normal">*Required</span>
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={loading || geoLocating}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1 bg-blue-950/40 border border-blue-800/50 hover:bg-blue-900/30 px-2.5 py-1.5 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {geoLocating ? (
                  <>
                    <FaSpinner className="animate-spin text-[10px]" />
                    <span>Locating...</span>
                  </>
                ) : (
                  <>
                    <FaMapMarkerAlt className="text-[10px]" />
                    <span>Use My Location</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-slate-400">
              City, district, landmark, or street address for geolocation and route calculation.
            </p>

            <input
              id="disaster-location"
              type="text"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (errors.location) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.location;
                    return next;
                  });
                }
              }}
              disabled={loading}
              placeholder="e.g. Pune, Maharashtra or Downtown Riverfront"
              className={`
                w-full px-4 py-3.5 rounded-xl bg-slate-900 border text-slate-100 text-sm placeholder:text-slate-500
                focus:outline-none focus:ring-2 transition duration-200
                ${
                  errors.location
                    ? "border-red-500 focus:ring-red-500/50"
                    : "border-slate-800 focus:border-slate-600 focus:ring-slate-700/50"
                }
                ${loading ? "opacity-60 cursor-not-allowed" : ""}
              `}
              aria-required="true"
              aria-invalid={errors.location ? "true" : "false"}
            />

            {errors.location && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                <FaExclamationCircle className="shrink-0" />
                <span>{errors.location}</span>
              </p>
            )}

            {geoAlert && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5 pt-1">
                <FaExclamationCircle className="shrink-0" />
                <span>{geoAlert}</span>
              </p>
            )}
          </div>

          {/* FIELD 2: IMAGE UPLOAD */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FaCamera className="text-red-500 text-xs" />
                <span>Incident Imagery</span>
                <span className="text-xs text-red-400 font-normal">*Required</span>
              </label>
              <span className="text-xs text-slate-500 font-mono">Max 10 MB</span>
            </div>

            <p className="text-xs text-slate-400">
              Visual evidence analyzed by AI vision for disaster categorization, severity, and hazard identification.
            </p>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              id="disaster-image-input"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
              disabled={loading}
            />

            {/* Upload Area / Preview */}
            {!image ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200
                  flex flex-col items-center justify-center gap-3
                  ${
                    isDragging
                      ? "border-red-500 bg-red-950/20"
                      : errors.image
                      ? "border-red-800 bg-red-950/10 hover:border-red-700"
                      : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
                  }
                  ${loading ? "opacity-60 cursor-not-allowed" : ""}
                `}
              >
                <div className="p-3.5 rounded-full bg-slate-800/80 text-slate-400 border border-slate-700/50">
                  <FaCloudUploadAlt className="text-2xl" />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-200">
                    Click to browse or drag and drop an image
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports all standard image formats up to 10 MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Live Preview Thumbnail */}
                {previewUrl && (
                  <img
                    src={previewUrl}
                    alt="Uploaded incident preview"
                    className="w-24 h-24 sm:w-20 sm:h-20 object-cover rounded-lg border border-slate-700 shrink-0 bg-slate-950"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {image.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatFileSize(image.size)} • {image.type || "Image"}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Ready for AI vision analysis</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRemoveImage}
                  disabled={loading}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-red-950/60 hover:text-red-300 text-slate-400 text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700 hover:border-red-800"
                >
                  <FaTrashAlt />
                  <span>Remove</span>
                </button>
              </div>
            )}

            {errors.image && (
              <p className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                <FaExclamationCircle className="shrink-0" />
                <span>{errors.image}</span>
              </p>
            )}
          </div>

          {/* FIELD 3: DESCRIPTION (OPTIONAL) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="disaster-description"
                className="text-sm font-semibold text-slate-200 flex items-center gap-2"
              >
                <FaFileAlt className="text-slate-400 text-xs" />
                <span>Incident Description</span>
                <span className="text-xs text-slate-500 font-normal">Optional</span>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              Provide additional situational details, eyewitness observations, or specific emergency context.
            </p>

            <textarea
              id="disaster-description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              placeholder="Describe ongoing conditions, trapped individuals, observed infrastructure hazards, or environmental factors..."
              className={`
                w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-500
                focus:outline-none focus:border-slate-600 focus:ring-2 focus:ring-slate-700/50 resize-none transition duration-200
                ${loading ? "opacity-60 cursor-not-allowed" : ""}
              `}
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2">
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={loading ? {} : { scale: 1.01 }}
              whileTap={loading ? {} : { scale: 0.99 }}
              className={`
                w-full py-4 rounded-xl font-bold text-white shadow-xl flex items-center justify-center gap-2.5 text-base tracking-wide transition-all duration-200 cursor-pointer
                ${
                  loading
                    ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 shadow-red-950/60 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-950"
                }
              `}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin text-lg" />
                  <span>Analyzing Incident with SwarmAI...</span>
                </>
              ) : (
                <>
                  <span>Analyze Incident</span>
                  <FaArrowRight className="text-sm" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
}