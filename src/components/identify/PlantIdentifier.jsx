import React, { useState, useRef } from "react";
import { identifyPlant, getPlantCareInfo } from "@/api/plantIdApi";
import { uploadPlantPhoto, getUserId } from "@/api/supabaseData";
import { Camera, Loader2, Leaf, X, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

export default function PlantIdentifier({ onIdentified }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingIdx, setSavingIdx] = useState(null);
  const [results, setResults] = useState(null);
  const [showMobileOptions, setShowMobileOptions] = useState(false);
  const fileRef = useRef(null);
  const cameraRef = useRef(null);
  const selectedFileRef = useRef(null);
  const isMobile = useIsMobile();

  const handleFile = (file) => {
    if (!file) return;
    selectedFileRef.current = file;
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setUploadedUrl(null);
    setResults(null);

    // Upload in background — does not block the Identify button
    (async () => {
      try {
        const userId = await getUserId();
        const safeName = file.name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9._-]/g, '');
        const path = userId
          ? `${userId}/${Date.now()}-${safeName}`
          : `anon/${Date.now()}-${safeName}`;
        const url = await uploadPlantPhoto(file, path);
        setUploadedUrl(url);
      } catch (err) {
        console.error('Photo upload failed:', err?.message);
        toast.error(`Photo upload failed: ${err?.message || 'Check Supabase Storage bucket setup.'}`);
        setUploadedUrl(null);
      }
    })();
  };

  const identifyPlantFromImage = async () => {
    const file = selectedFileRef.current || fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Photo is no longer available. Please take or upload a new photo.");
      return;
    }
    setLoading(true);
    try {
      const idResults = await identifyPlant(file);
      const enriched = [];

      for (const r of idResults.slice(0, 3)) {
        const name = r.scientific_name || r.common_name;
        try {
          const details = await getPlantCareInfo(name);
          enriched.push({
            common_name: details.common_name || r.common_name,
            scientific_name: details.scientific_name || r.scientific_name,
            confidence: r.score,
            plant_type: details.plant_type,
            difficulty: details.difficulty,
            sunlight: details.sunlight,
            watering_interval_days: details.watering_interval_days,
            humidity: details.humidity,
            temperature_min: details.temperature_min,
            temperature_max: details.temperature_max,
            soil_type: details.soil_type,
            fertilize_interval_days: details.fertilize_interval_days,
            toxicity_pets: details.toxicity_pets,
            toxicity_humans: details.toxicity_humans,
            pruning_notes: details.pruning_notes,
            description: details.description,
          });
        } catch (_) {
          enriched.push({
            common_name: r.common_name,
            scientific_name: r.scientific_name,
            confidence: r.score,
            plant_type: "houseplant",
            difficulty: "moderate",
            sunlight: "bright_indirect",
            watering_interval_days: 7,
            humidity: "medium",
            temperature_min: null,
            temperature_max: null,
            soil_type: null,
            fertilize_interval_days: 30,
            toxicity_pets: false,
            toxicity_humans: false,
            pruning_notes: null,
            description: "Care details unavailable. Water regularly and provide adequate light.",
          });
        }
      }

      setResults(enriched);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Identification failed. Check your VITE_PLANT_ID_API_KEY in .env.local.");
    }
    setLoading(false);
  };

  const reset = () => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    setResults(null);
    setShowMobileOptions(false);
    selectedFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
  };

  const handleUploadZoneClick = () => {
    if (isMobile) {
      setShowMobileOptions(true);
    } else {
      fileRef.current?.click();
    }
  };

  const photoUrl = uploadedUrl || previewUrl;

  return (
    <div className="space-y-4">
      <AnimatePresence mode="wait">
        {!previewUrl ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { handleFile(e.target.files[0]); setShowMobileOptions(false); }}
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => { handleFile(e.target.files[0]); setShowMobileOptions(false); }}
            />
            <div
              onClick={handleUploadZoneClick}
              className="border-2 border-dashed border-primary/30 rounded-3xl p-10 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Camera className="w-9 h-9 text-primary" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-foreground">Take a Photo or Upload</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Point your camera at any plant
                </p>
              </div>
            </div>

            <AnimatePresence>
              {showMobileOptions && (
                <>
                  <motion.div
                    key="backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileOptions(false)}
                    className="fixed inset-0 bg-black/40 z-[59]"
                  />
                  <motion.div
                    key="sheet"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 z-[60] bg-background rounded-t-3xl p-6 shadow-xl"
                    style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 5rem)" }}
                  >
                    <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-6" />
                    <p className="text-center font-semibold text-base mb-5">Add a Plant Photo</p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => cameraRef.current?.click()}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-primary/10 hover:bg-primary/20 active:scale-[0.98] transition-all"
                      >
                        <div className="w-11 h-11 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Camera className="w-5 h-5 text-primary" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Take a Photo</p>
                          <p className="text-xs text-muted-foreground">Use your camera</p>
                        </div>
                      </button>
                      <button
                        onClick={() => fileRef.current?.click()}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-muted hover:bg-muted/80 active:scale-[0.98] transition-all"
                      >
                        <div className="w-11 h-11 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
                          <FolderOpen className="w-5 h-5 text-foreground" />
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">Upload from Library</p>
                          <p className="text-xs text-muted-foreground">Choose an existing photo</p>
                        </div>
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="relative rounded-3xl overflow-hidden">
              <img
                src={previewUrl}
                alt="Plant"
                className="w-full h-64 object-cover"
              />
              <button
                onClick={reset}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-foreground/70 text-background flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!results && (
              <Button
                onClick={identifyPlantFromImage}
                disabled={loading}
                className="w-full mt-4 h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Identifying...
                  </>
                ) : (
                  <>
                    <Leaf className="w-4 h-4 mr-2" />
                    Identify Plant
                  </>
                )}
              </Button>
            )}

            {results && (
              <div className="mt-4 space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Results
                </h3>
                {results.map((match, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={async () => {
                      if (savingIdx !== null) return;
                      setSavingIdx(idx);
                      try {
                        await onIdentified(match, uploadedUrl || null);
                      } finally {
                        setSavingIdx(null);
                      }
                    }}
                    className={`p-4 rounded-2xl border border-border bg-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98] ${savingIdx !== null ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{match.common_name}</p>
                        <p className="text-xs text-muted-foreground italic">
                          {match.scientific_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        {savingIdx === idx && (
                          <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        )}
                        <div
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            match.confidence >= 0.8
                              ? "bg-primary/10 text-primary"
                              : match.confidence >= 0.5
                              ? "bg-accent/10 text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {Math.round((match.confidence || 0) * 100)}%
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {match.description}
                    </p>
                    <p className="text-xs text-primary font-medium mt-2">
                      {savingIdx === idx ? "Adding to your plants..." : "Tap to add to my plants →"}
                    </p>
                  </motion.div>
                ))}
                <Button
                  variant="outline"
                  onClick={reset}
                  className="w-full rounded-2xl"
                >
                  Try Another Photo
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
