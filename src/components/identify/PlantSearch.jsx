import React, { useState, useEffect, useRef, useCallback } from "react";
import { searchPlants } from "@/api/inaturalistApi";
import { isPetToxic } from "@/lib/toxicityLookup";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Leaf, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function PlantSearch({ onSelected }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const containerRef = useRef(null);

  const doSearch = useCallback(async (q) => {
    if (!q || q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setSearching(true);
    try {
      const hits = await searchPlants(q);
      setResults(hits);
      setOpen(true);
    } catch (err) {
      toast.error(err?.message || "Search failed.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query), 350);
    return () => clearTimeout(debounceRef.current);
  }, [query, doSearch]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (plant) => {
    if (savingId !== null) return;
    setSavingId(plant.id);
    setOpen(false);
    try {
      const plantData = {
        common_name: plant.common_name,
        scientific_name: plant.scientific_name || "",
        plant_type: "houseplant",
        difficulty: "moderate",
        sunlight: "medium",
        watering_interval_days: 7,
        humidity: "medium",
        temperature_min: null,
        temperature_max: null,
        soil_type: null,
        fertilize_interval_days: 30,
        toxicity_pets: isPetToxic(plant.scientific_name, plant.common_name),
        toxicity_humans: false,
        pruning_notes: null,
        description: `${plant.common_name} was added via search. Update care details as needed.`,
      };
      await onSelected(plantData, plant.image_url || null);
    } catch (err) {
      toast.error(err?.message || "Failed to add plant.");
    } finally {
      setSavingId(null);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search by plant name..."
          className="pl-9 pr-9 h-11 rounded-2xl bg-muted border-0 text-sm"
        />
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : query ? (
            <button onClick={clearSearch}>
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          ) : null}
        </div>
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {results.map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => handleSelect(plant)}
                  disabled={savingId !== null}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/5 active:bg-primary/10 transition-colors text-left disabled:opacity-60"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-primary/10 shrink-0 flex items-center justify-center">
                    {plant.image_url ? (
                      <img
                        src={plant.image_url}
                        alt={plant.common_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <Leaf
                      className="w-5 h-5 text-primary"
                      style={{ display: plant.image_url ? "none" : "block" }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{plant.common_name}</p>
                    <p className="text-xs text-muted-foreground italic truncate">
                      {plant.scientific_name}
                    </p>
                  </div>
                  {savingId === plant.id && (
                    <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {open && !searching && results.length === 0 && query.trim().length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="absolute z-50 w-full mt-2 bg-card border border-border rounded-2xl shadow-lg px-4 py-6 text-center"
          >
            <p className="text-sm text-muted-foreground">No plants found for "{query}"</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
