import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Droplets, Sun, AlertTriangle } from "lucide-react";
import { differenceInDays } from "date-fns";

const healthColors = {
  thriving: "bg-primary text-primary-foreground",
  healthy: "bg-primary/80 text-primary-foreground",
  needs_attention: "bg-accent text-accent-foreground",
  struggling: "bg-destructive text-destructive-foreground",
};

export default function PlantCard({ plant }) {
  const daysSinceWatered = plant.last_watered
    ? differenceInDays(new Date(), new Date(plant.last_watered))
    : null;

  const needsWater =
    daysSinceWatered !== null &&
    daysSinceWatered >= (plant.watering_interval_days || 7);

  return (
    <Link
      to={createPageUrl("PlantProfile") + `?id=${plant.id}`}
      className="block"
    >
      <div className="rounded-2xl overflow-hidden border border-border bg-card hover:shadow-lg transition-all duration-300 active:scale-[0.97]">
        <div className="relative h-36">
          {plant.photo_url ? (
            <img
              src={plant.photo_url}
              alt={plant.plant_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
              <span className="text-4xl">🌱</span>
            </div>
          )}
          {plant.toxicity_pets && (
            <div className="absolute top-2 right-2 bg-destructive/90 text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              Pets
            </div>
          )}
        </div>
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate">
                {plant.nickname || plant.plant_name}
              </p>
              <p className="text-[11px] text-muted-foreground truncate capitalize">
                {plant.plant_type || "Plant"}
              </p>
            </div>
            <div
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                healthColors[plant.health_status || "healthy"]
              }`}
            >
              {(plant.health_status || "healthy").replace("_", " ")}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2.5">
            <div className={`flex items-center gap-1 text-[11px] ${
              needsWater ? "text-blue-600 font-semibold" : "text-muted-foreground"
            }`}>
              <Droplets className="w-3 h-3" />
              {daysSinceWatered !== null ? `${daysSinceWatered}d ago` : "—"}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sun className="w-3 h-3" />
              {(plant.sunlight || "medium").replace("_", " ")}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}