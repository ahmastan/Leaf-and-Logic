import React, { useState, useRef } from "react";
import { identifyPlant } from "@/api/plantnetApi";
import { searchSpecies, getSpeciesDetails } from "@/api/perenualApi";
import { uploadPlantPhoto, getUserId } from "@/api/supabaseData";
import { Camera, Upload, Loader2, Leaf, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PlantIdentifier({ onIdentified }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const fileRef = useRef(null);
  const selectedFileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    selectedFileRef.current = file;
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setResults(null);
    setImageUrl(preview);
  };

  const identifyPlantFromImage = async () => {
    const file = selectedFileRef.current || fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Photo is no longer available. Please take or upload a new photo.");
      return;
    }
    setLoading(true);
    try {
      const plantnetResults = await identifyPlant(file);
      const enriched = [];
      for (const r of plantnetResults.slice(0, 3)) {
        const name = r.common_name || r.scientific_name;
        if (!name) {
          enriched.push({
            common_name: "Unknown",
            scientific_name: r.scientific_name || "",
            confidence: r.score,
            description: "Identification uncertain.",
            plant_type: "houseplant",
            difficulty: "easy",
            sunlight: "medium",
            watering_interval_days: 7,
            fertilize_interval_days: 30,
            toxicity_pets: false,
            toxicity_humans: false,
            pruning_notes: null,
            humidity: "medium",
            temperature_min: null,
            temperature_max: null,
            soil_type: null,
          });
          continue;
        }
        try {
          const list = await searchSpecies(name);
          if (list.length > 0) {
            const details = await getSpeciesDetails(list[0].id);
            enriched.push({
              common_name: details.common_name || r.common_name,
              scientific_name: details.scientific_name || r.scientific_name,
              confidence: r.score,
              description: details.description,
              plant_type: details.plant_type,
              difficulty: details.difficulty,
              sunlight: details.sunlight,
              watering_interval_days: details.watering_interval_days,
              fertilize_interval_days: details.fertilize_interval_days,
              toxicity_pets: details.toxicity_pets,
              toxicity_humans: details.toxicity_humans,
              pruning_notes: details.pruning_notes,
              humidity: details.humidity,
              temperature_min: details.temperature_min,
              temperature_max: details.temperature_max,
              soil_type: details.soil_type,
            });
          } else {
            enriched.push({
              common_name: r.common_name,
              scientific_name: r.scientific_name,
              confidence: r.score,
              description: "Care details not found. Add watering and light as needed.",
              plant_type: "houseplant",
              difficulty: "easy",
              sunlight: "medium",
              watering_interval_days: 7,
              fertilize_interval_days: 30,
              toxicity_pets: false,
              toxicity_humans: false,
              pruning_notes: null,
              humidity: "medium",
              temperature_min: null,
              temperature_max: null,
              soil_type: null,
            });
          }
        } catch (_) {
          enriched.push({
            common_name: r.common_name,
            scientific_name: r.scientific_name,
            confidence: r.score,
            description: "Care details not found.",
            plant_type: "houseplant",
            difficulty: "easy",
            sunlight: "medium",
            watering_interval_days: 7,
            fertilize_interval_days: 30,
            toxicity_pets: false,
            toxicity_humans: false,
            pruning_notes: null,
            humidity: "medium",
            temperature_min: null,
            temperature_max: null,
            soil_type: null,
          });
        }
      }
      setResults(enriched);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Identification failed. Check your Pl@ntNet API key in .env.local.");
      setResults([{
        common_name: "Identification failed",
        scientific_name: "",
        confidence: 0,
        description: err?.message || "Could not identify plant. Check your Pl@ntNet API key and try again.",
        plant_type: "houseplant",
        difficulty: "easy",
        sunlight: "medium",
        watering_interval_days: 7,
        fertilize_interval_days: 30,
        toxicity_pets: false,
        toxicity_humans: false,
        pruning_notes: null,
        humidity: "medium",
        temperature_min: null,
        temperature_max: null,
        soil_type: null,
      }]);
    }
    setLoading(false);
  };

  const handleSelectMatch = async (match) => {
    let photoUrl = imageUrl;
    const file = selectedFileRef.current || fileRef.current?.files?.[0];
    if (file) {
      try {
        const userId = await getUserId();
        const path = `${userId}/${Date.now()}-${file.name}`;
        photoUrl = await uploadPlantPhoto(file, path);
      } catch (_) {
        photoUrl = previewUrl;
      }
    } else if (previewUrl) {
      photoUrl = previewUrl;
    }
    onIdentified(match, photoUrl);
  };

  const reset = () => {
    setImageUrl(null);
    setPreviewUrl(null);
    setResults(null);
    selectedFileRef.current = null;
    if (fileRef.current) fileRef.current.value = "";
  };

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
              capture="environment"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
            <div
              onClick={() => fileRef.current?.click()}
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
                    onClick={() => handleSelectMatch(match)}
                    className="p-4 rounded-2xl border border-border bg-card cursor-pointer hover:border-primary/40 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{match.common_name}</p>
                        <p className="text-xs text-muted-foreground italic">
                          {match.scientific_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
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
