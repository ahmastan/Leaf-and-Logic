import React, { useState } from "react";
import {
  listCareTasks,
  listUserPlants,
  updateCareTask,
} from "@/api/supabaseData";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalendarView from "../components/calendar/CalendarView";

export default function Calendar() {
  const [filterPlant, setFilterPlant] = useState("");
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["careTasks"],
    queryFn: () => listCareTasks("due_date", 200),
  });

  const { data: plants = [] } = useQuery({
    queryKey: ["userPlants"],
    queryFn: () => listUserPlants("created_at", false),
  });

  const completeTask = useMutation({
    mutationFn: (task) =>
      updateCareTask(task.id, {
        completed: true,
        completed_date: format(new Date(), "yyyy-MM-dd"),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["careTasks"] }),
  });

  return (
    <div className="px-5 pt-6 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>

      {plants.length > 0 && (
        <div className="mb-4">
          <Select value={filterPlant} onValueChange={setFilterPlant}>
            <SelectTrigger className="rounded-2xl h-10">
              <SelectValue placeholder="All Plants" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all_plants">All Plants</SelectItem>
              {plants.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nickname || p.plant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <CalendarView
          tasks={tasks}
          onComplete={(task) => completeTask.mutate(task)}
          filterPlant={filterPlant && filterPlant !== "all_plants" ? filterPlant : ""}
        />
      )}
    </div>
  );
}
