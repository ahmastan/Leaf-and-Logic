import React from "react";
import { AlertTriangle, Droplets, Thermometer } from "lucide-react";
import { differenceInDays } from "date-fns";
import { motion } from "framer-motion";

export default function PlantHealthAlerts({ plants }) {
  const alerts = [];

  plants.forEach((plant) => {
    if (plant.health_status === "needs_attention" || plant.health_status === "struggling") {
      alerts.push({
        id: `health-${plant.id}`,
        plant: plant.nickname || plant.plant_name,
        type: "health",
        message: plant.health_status === "struggling"
          ? "Needs immediate attention"
          : "Check on this plant",
        icon: AlertTriangle,
        color: plant.health_status === "struggling" ? "text-destructive" : "text-accent",
        bg: plant.health_status === "struggling" ? "bg-destructive/10" : "bg-accent/10",
      });
    }

    if (plant.last_watered) {
      const daysSince = differenceInDays(new Date(), new Date(plant.last_watered));
      if (daysSince > (plant.watering_interval_days || 7) + 2) {
        alerts.push({
          id: `water-${plant.id}`,
          plant: plant.nickname || plant.plant_name,
          type: "water",
          message: `Not watered in ${daysSince} days`,
          icon: Droplets,
          color: "text-blue-500",
          bg: "bg-blue-500/10",
        });
      }
    }
  });

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((alert, idx) => {
        const Icon = alert.icon;
        return (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-3 p-3 rounded-xl ${alert.bg}`}
          >
            <Icon className={`w-4 h-4 ${alert.color} shrink-0`} />
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{alert.plant}</p>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}