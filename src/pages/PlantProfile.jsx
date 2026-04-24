import React, { useState } from "react";
import {
  getUserPlant,
  filterCareTasks,
  updateUserPlant,
  deleteUserPlant,
  deleteCareTask,
} from "@/api/supabaseData";
import { getPlantCareInfo } from "@/api/plantIdApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Heart,
  Lightbulb,
  Check,
  Camera,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import CareProfile from "../components/plants/CareProfile";

export default function PlantProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const plantId = urlParams.get("id");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [aiTip, setAiTip] = useState(null);
  const [tipLoading, setTipLoading] = useState(false);

  const { data: plant, isLoading } = useQuery({
    queryKey: ["userPlant", plantId],
    queryFn: () => getUserPlant(plantId),
    enabled: !!plantId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ["plantTasks", plantId],
    queryFn: () => filterCareTasks({ user_plant_id: plantId }, "due_date", 20),
    enabled: !!plantId,
  });

  const updatePlant = useMutation({
    mutationFn: (data) => updateUserPlant(plantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userPlant", plantId] });
      queryClient.invalidateQueries({ queryKey: ["userPlants"] });
    },
  });

  const deletePlant = useMutation({
    mutationFn: async () => {
      const relatedTasks = await filterCareTasks({ user_plant_id: plantId }, "due_date", 500);
      for (const task of relatedTasks) {
        await deleteCareTask(task.id);
      }
      await deleteUserPlant(plantId);
    },
    onSuccess: () => {
      toast.success("Plant removed");
      navigate(createPageUrl("MyPlants"));
    },
  });

  const getAiTip = async () => {
    if (!plant) return;
    setTipLoading(true);
    try {
      const details = await getPlantCareInfo(plant.plant_name || plant.scientific_name || "");
      const parts = [];
      if (details.description) parts.push(details.description);
      if (details.watering_interval_days) parts.push(`Water every ${details.watering_interval_days} days.`);
      if (details.sunlight) parts.push(`Light: ${details.sunlight.replace(/_/g, " ")}.`);
      if (details.pruning_notes) parts.push(details.pruning_notes);
      setAiTip(parts.length > 0 ? parts.join(" ") : `Keep your ${plant.plant_name} in ${plant.location || "indoor"} conditions and water every ${plant.watering_interval_days || 7} days.`);
    } catch (e) {
      setAiTip(`Keep your ${plant.plant_name} in ${plant.location || "indoor"} conditions. Water every ${plant.watering_interval_days || 7} days.`);
    }
    setTipLoading(false);
  };

  const markWatered = () => {
    updatePlant.mutate({ last_watered: format(new Date(), "yyyy-MM-dd") });
    toast.success("Marked as watered!");
  };

  if (isLoading || !plant) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const upcomingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5);

  return (
    <div className="max-w-lg mx-auto pb-4">
      <div className="relative h-56">
        {plant.photo_url ? (
          <img src={plant.photo_url} alt={plant.plant_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <span className="text-6xl">🌿</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-9 h-9 rounded-xl bg-background/80 backdrop-blur flex items-center justify-center">
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => deletePlant.mutate()} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" /> Delete Plant
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="px-5 -mt-8 relative">
        <div className="mb-5">
          <h1 className="text-2xl font-bold">{plant.nickname || plant.plant_name}</h1>
          {plant.nickname && (
            <p className="text-sm text-muted-foreground">{plant.plant_name}</p>
          )}
          <p className="text-xs text-muted-foreground italic mt-0.5">
            {plant.scientific_name}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
              {plant.plant_type || "Plant"}
            </span>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
              {plant.difficulty || "Easy"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={markWatered}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-blue-50 text-blue-600 font-semibold text-sm active:scale-95 transition-transform"
          >
            💧 Water Now
          </button>
          <button
            onClick={getAiTip}
            disabled={tipLoading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-primary/10 text-primary font-semibold text-sm active:scale-95 transition-transform"
          >
            {tipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            Get Tips
          </button>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
            Health Status
          </p>
          <Select
            value={plant.health_status || "healthy"}
            onValueChange={(val) => updatePlant.mutate({ health_status: val })}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thriving">🌟 Thriving</SelectItem>
              <SelectItem value="healthy">💚 Healthy</SelectItem>
              <SelectItem value="needs_attention">⚠️ Needs Attention</SelectItem>
              <SelectItem value="struggling">🆘 Struggling</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {aiTip && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/10">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{aiTip}</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Care Guide
          </p>
          <CareProfile plant={plant} />
        </div>

        {upcomingTasks.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Upcoming Tasks
            </p>
            <div className="space-y-2">
              {upcomingTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-border bg-card"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {task.task_type.replace("_", " ")}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {format(new Date(task.due_date), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
