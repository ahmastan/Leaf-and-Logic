import React, { useState, useEffect } from "react";
import { Lightbulb, RefreshCw } from "lucide-react";
import { searchSpecies, getSpeciesDetails } from "@/api/perenualApi";

const fallbackTips = [
  "Water your plants in the morning for best absorption.",
  "Yellow leaves often indicate overwatering, not underwatering.",
  "Most houseplants prefer indirect sunlight.",
  "Group tropical plants together to increase humidity.",
  "Let tap water sit overnight before watering to remove chlorine.",
  "Rotate your plants weekly for even growth.",
  "Check the top inch of soil before watering – if dry, it's time.",
];

export default function QuickTip({ plants }) {
  const [tip, setTip] = useState("");
  const [loading, setLoading] = useState(false);

  const getRandomFallback = () => {
    return fallbackTips[Math.floor(Math.random() * fallbackTips.length)];
  };

  const fetchTip = async () => {
    if (plants.length === 0) {
      setTip(getRandomFallback());
      return;
    }
    setLoading(true);
    try {
      const plant = plants[Math.floor(Math.random() * Math.min(5, plants.length))];
      const name = plant.plant_name || plant.scientific_name;
      if (name) {
        const list = await searchSpecies(name);
        if (list.length > 0) {
          const details = await getSpeciesDetails(list[0].id);
          setTip(details.description || getRandomFallback());
          setLoading(false);
          return;
        }
      }
    } catch (_) {}
    setTip(getRandomFallback());
    setLoading(false);
  };

  useEffect(() => {
    setTip(getRandomFallback());
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 p-4 border border-primary/10">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Daily Tip</p>
            <button
              onClick={fetchTip}
              disabled={loading}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
          <p className="text-sm text-foreground leading-relaxed">
            {loading ? "Getting a tip for your plants..." : tip}
          </p>
        </div>
      </div>
    </div>
  );
}
