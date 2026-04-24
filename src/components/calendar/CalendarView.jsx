import React, { useState } from "react";
import { format, addDays, startOfWeek, isSameDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, Check, Droplets, Scissors, Flower2, Bug, RotateCcw, Beaker } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const taskIcons = {
  watering: Droplets,
  fertilizing: Beaker,
  pruning: Scissors,
  repotting: Flower2,
  pest_check: Bug,
  rotation: RotateCcw,
};

const taskDotColors = {
  watering: "bg-blue-500",
  fertilizing: "bg-amber-500",
  pruning: "bg-emerald-500",
  repotting: "bg-orange-500",
  pest_check: "bg-red-500",
  rotation: "bg-purple-500",
};

const taskBgColors = {
  watering: "bg-blue-50 border-blue-100",
  fertilizing: "bg-amber-50 border-amber-100",
  pruning: "bg-emerald-50 border-emerald-100",
  repotting: "bg-orange-50 border-orange-100",
  pest_check: "bg-red-50 border-red-100",
  rotation: "bg-purple-50 border-purple-100",
};

export default function CalendarView({ tasks, onComplete, filterPlant }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getTasksForDate = (date) => {
    return tasks.filter((t) => {
      if (!t.due_date) return false;
      const match = isSameDay(new Date(t.due_date), date);
      if (filterPlant) return match && t.user_plant_id === filterPlant;
      return match;
    });
  };

  const selectedDayTasks = getTasksForDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* Week navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart(addDays(weekStart, -7))}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold">
          {format(weekStart, "MMM d")} – {format(addDays(weekStart, 6), "MMM d, yyyy")}
        </p>
        <button
          onClick={() => setWeekStart(addDays(weekStart, 7))}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center py-2 rounded-2xl transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : today
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              }`}
            >
              <span className="text-[10px] font-medium opacity-70">
                {format(day, "EEE")}
              </span>
              <span className={`text-sm font-bold mt-0.5 ${
                isSelected ? "" : today ? "text-primary" : ""
              }`}>
                {format(day, "d")}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-1">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isSelected ? "bg-primary-foreground" : taskDotColors[t.task_type] || "bg-muted-foreground"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Tasks for selected day */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          {isToday(selectedDate) ? "Today" : format(selectedDate, "EEEE, MMM d")}
          {selectedDayTasks.length > 0 && (
            <span className="text-muted-foreground font-normal ml-1">
              ({selectedDayTasks.length} task{selectedDayTasks.length !== 1 ? "s" : ""})
            </span>
          )}
        </h3>
        <AnimatePresence mode="wait">
          {selectedDayTasks.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-muted-foreground text-center py-6"
            >
              No tasks for this day
            </motion.p>
          ) : (
            <motion.div
              key={selectedDate.toISOString()}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              {selectedDayTasks.map((task) => {
                const Icon = taskIcons[task.task_type] || Droplets;
                return (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border ${
                      task.completed
                        ? "bg-muted/50 opacity-60"
                        : taskBgColors[task.task_type] || "bg-card border-border"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.completed ? "line-through" : ""}`}>
                        {task.plant_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {task.task_type.replace("_", " ")}
                      </p>
                    </div>
                    {!task.completed && (
                      <button
                        onClick={() => onComplete(task)}
                        className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all active:scale-90"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {task.completed && (
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}