import React from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, addDays } from "date-fns";
import { ArrowLeft } from "lucide-react";
import PlantIdentifier from "../components/identify/PlantIdentifier";
import { toast } from "sonner";
import {
  createUserPlant,
  createPlant,
  bulkCreateCareTasks,
} from "@/api/supabaseData";

export default function IdentifyPlant() {
  const navigate = useNavigate();

  const handlePlantIdentified = async (plantData, photoUrl) => {
    let userPlant;

    try {
      userPlant = await createUserPlant({
        plant_name: plantData.common_name,
        scientific_name: plantData.scientific_name,
        plant_type: plantData.plant_type,
        photo_url: photoUrl,
        location: "indoor",
        pot_size: "medium",
        health_status: "healthy",
        last_watered: format(new Date(), "yyyy-MM-dd"),
        watering_interval_days: plantData.watering_interval_days || 7,
        sunlight: plantData.sunlight || "medium",
        difficulty: plantData.difficulty || "easy",
        toxicity_pets: plantData.toxicity_pets || false,
      });
    } catch (err) {
      toast.error(`Failed to save plant: ${err?.message || String(err)}`);
      return;
    }

    try {
      await createPlant({
        common_name: plantData.common_name,
        scientific_name: plantData.scientific_name,
        plant_type: plantData.plant_type,
        difficulty: plantData.difficulty,
        sunlight: plantData.sunlight,
        watering_interval_days: plantData.watering_interval_days,
        humidity: plantData.humidity,
        temperature_min: plantData.temperature_min,
        temperature_max: plantData.temperature_max,
        soil_type: plantData.soil_type,
        fertilize_interval_days: plantData.fertilize_interval_days,
        toxicity_pets: plantData.toxicity_pets,
        toxicity_humans: plantData.toxicity_humans,
        pruning_notes: plantData.pruning_notes,
        description: plantData.description,
        image_url: photoUrl,
      });
    } catch (_) {
      // plant may already exist in reference table — not a blocker
    }

    const today = new Date();
    const waterInterval = plantData.watering_interval_days || 7;
    const fertInterval = plantData.fertilize_interval_days || 30;

    const tasksToCreate = [];

    for (let i = 0; i < 4; i++) {
      tasksToCreate.push({
        user_plant_id: userPlant.id,
        plant_name: plantData.common_name,
        task_type: "watering",
        due_date: format(addDays(today, waterInterval * (i + 1)), "yyyy-MM-dd"),
        completed: false,
        recurring: true,
        interval_days: waterInterval,
      });
    }

    tasksToCreate.push({
      user_plant_id: userPlant.id,
      plant_name: plantData.common_name,
      task_type: "fertilizing",
      due_date: format(addDays(today, fertInterval), "yyyy-MM-dd"),
      completed: false,
      recurring: true,
      interval_days: fertInterval,
    });

    tasksToCreate.push({
      user_plant_id: userPlant.id,
      plant_name: plantData.common_name,
      task_type: "pest_check",
      due_date: format(addDays(today, 14), "yyyy-MM-dd"),
      completed: false,
      recurring: true,
      interval_days: 14,
    });

    try {
      await bulkCreateCareTasks(tasksToCreate);
    } catch (_) {
      // care tasks failure is non-blocking
    }

    toast.success(`${plantData.common_name} added to your garden!`);
    navigate(createPageUrl("PlantProfile") + `?id=${userPlant.id}`);
  };

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Identify Plant</h1>
          <p className="text-xs text-muted-foreground">
            Take or upload a photo
          </p>
        </div>
      </div>

      <PlantIdentifier onIdentified={handlePlantIdentified} />
    </div>
  );
}
