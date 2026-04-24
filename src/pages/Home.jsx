import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import {
  listUserPlants,
  listCareTasks,
  updateCareTask,
} from "@/api/supabaseData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Leaf, Plus, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import TodaysTasks from "../components/home/TodaysTasks";
import PlantHealthAlerts from "../components/home/PlantHealthAlerts";
import QuickTip from "../components/home/QuickTip";

export default function Home() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: plants = [], isLoading: plantsLoading } = useQuery({
    queryKey: ["userPlants"],
    queryFn: () => listUserPlants("created_at", false),
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["careTasks"],
    queryFn: () => listCareTasks("due_date", 100),
  });

  const completeTask = useMutation({
    mutationFn: (task) =>
      updateCareTask(task.id, {
        completed: true,
        completed_date: format(new Date(), "yyyy-MM-dd"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["careTasks"] }),
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            {greeting()}
          </p>
          <h1 className="text-2xl font-bold mt-0.5">
            {user?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Plant Lover"} 🌿
          </h1>
        </div>
        <Link
          to={createPageUrl("IdentifyPlant")}
          className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-transform"
        >
          <Camera className="w-5 h-5" />
        </Link>
      </div>

      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
          <Leaf className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="text-lg font-bold">{plants.length}</p>
          <p className="text-xs text-muted-foreground">
            {plants.length === 1 ? "Plant" : "Plants"} in your garden
          </p>
        </div>
        <Link
          to={createPageUrl("IdentifyPlant")}
          className="ml-auto text-xs font-semibold text-primary flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Add
        </Link>
      </div>

      {plants.length > 0 && (
        <div className="mb-6">
          <PlantHealthAlerts plants={plants} />
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-base">Today's Tasks</h2>
          <Link to={createPageUrl("Calendar")} className="text-xs font-semibold text-primary">
            View All
          </Link>
        </div>
        <TodaysTasks
          tasks={tasks}
          onComplete={(task) => completeTask.mutate(task)}
          isLoading={tasksLoading}
        />
      </div>

      <div className="mb-4">
        <QuickTip plants={plants} />
      </div>

      {plants.length === 0 && !plantsLoading && (
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">📷</span>
          </div>
          <h3 className="font-semibold mb-1">No plants yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Take a photo of a plant to get started
          </p>
          <Link
            to={createPageUrl("IdentifyPlant")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm active:scale-95 transition-transform"
          >
            <Camera className="w-4 h-4" /> Identify Your First Plant
          </Link>
        </div>
      )}
    </div>
  );
}
