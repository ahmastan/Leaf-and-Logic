import React, { useState } from "react";
import { listUserPlants } from "@/api/supabaseData";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import PlantCard from "../components/plants/PlantCard";

export default function MyPlants() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: plants = [], isLoading } = useQuery({
    queryKey: ["userPlants"],
    queryFn: () => listUserPlants("created_at", false),
  });

  const plantTypes = [...new Set(plants.map((p) => p.plant_type).filter(Boolean))];

  const filtered = plants.filter((p) => {
    const nameMatch =
      !search ||
      (p.plant_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.nickname || "").toLowerCase().includes(search.toLowerCase());
    const typeMatch = typeFilter === "all" || p.plant_type === typeFilter;
    return nameMatch && typeMatch;
  });

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">My Plants</h1>
        <Link
          to={createPageUrl("IdentifyPlant")}
          className="w-10 h-10 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
        >
          <Plus className="w-5 h-5" />
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search plants..."
          className="pl-9 rounded-2xl h-11 bg-muted border-0"
        />
      </div>

      {plantTypes.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
          <button
            onClick={() => setTypeFilter("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              typeFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            All
          </button>
          {plantTypes.map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                typeFilter === type
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((plant) => (
            <PlantCard key={plant.id} plant={plant} />
          ))}
        </div>
      ) : plants.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-5xl block mb-4">🌱</span>
          <h3 className="font-semibold mb-1">No plants yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Start by identifying your first plant
          </p>
          <Link
            to={createPageUrl("IdentifyPlant")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm"
          >
            <Plus className="w-4 h-4" /> Add Plant
          </Link>
        </div>
      ) : (
        <p className="text-center py-8 text-sm text-muted-foreground">
          No plants match your search
        </p>
      )}
    </div>
  );
}
