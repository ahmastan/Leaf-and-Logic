import React from "react";
import { Droplets, Sun, Thermometer, Wind, Flower2, Scissors, AlertTriangle, Beaker } from "lucide-react";

const sunlightLabels = {
  low: "Low Light",
  medium: "Medium Light",
  bright_indirect: "Bright Indirect",
  direct: "Direct Sun",
};

const humidityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export default function CareProfile({ plant }) {
  const careItems = [
    {
      icon: Droplets,
      label: "Watering",
      value: `Every ${plant.watering_interval_days || 7} days`,
      color: "text-blue-600 bg-blue-50",
    },
    {
      icon: Sun,
      label: "Sunlight",
      value: sunlightLabels[plant.sunlight] || plant.sunlight || "Medium",
      color: "text-amber-600 bg-amber-50",
    },
    {
      icon: Thermometer,
      label: "Temperature",
      value: plant.temperature_min && plant.temperature_max
        ? `${plant.temperature_min}°F – ${plant.temperature_max}°F`
        : "60°F – 80°F",
      color: "text-red-500 bg-red-50",
    },
    {
      icon: Wind,
      label: "Humidity",
      value: humidityLabels[plant.humidity] || plant.humidity || "Medium",
      color: "text-teal-600 bg-teal-50",
    },
    {
      icon: Beaker,
      label: "Fertilizing",
      value: plant.fertilize_interval_days
        ? `Every ${plant.fertilize_interval_days} days`
        : "Monthly",
      color: "text-amber-700 bg-amber-50",
    },
    {
      icon: Scissors,
      label: "Pruning",
      value: plant.pruning_notes || "As needed",
      color: "text-emerald-600 bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {careItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="p-3 rounded-2xl border border-border bg-card"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${item.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[11px] text-muted-foreground font-medium">{item.label}</p>
              <p className="text-xs font-semibold mt-0.5 line-clamp-2">{item.value}</p>
            </div>
          );
        })}
      </div>

      {(plant.toxicity_pets || plant.toxicity_humans) && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-destructive/5 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-xs text-destructive font-medium">
            Toxic to {[plant.toxicity_pets && "pets", plant.toxicity_humans && "humans"].filter(Boolean).join(" and ")}
          </p>
        </div>
      )}
    </div>
  );
}