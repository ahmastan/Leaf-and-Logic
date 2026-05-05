import React, { useState } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  isToday,
} from "date-fns";
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
  watering: "bg-blue-500/10 border-blue-500/20",
  fertilizing: "bg-amber-500/10 border-amber-500/20",
  pruning: "bg-emerald-500/10 border-emerald-500/20",
  repotting: "bg-orange-500/10 border-orange-500/20",
  pest_check: "bg-red-500/10 border-red-500/20",
  rotation: "bg-purple-500/10 border-purple-500/20",
};

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarView({ tasks, onComplete, filterPlant }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const getTasksForDate = (date) =>
    tasks.filter((t) => {
      if (!t.due_date) return false;
      const match = isSameDay(new Date(t.due_date + "T00:00:00"), date);
      if (filterPlant) return match && t.user_plant_id === filterPlant;
      return match;
    });

  const selectedDayTasks = getTasksForDate(selectedDate);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <p className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</p>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d) => (
          <p key={d} className="text-center text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
            {d}
          </p>
        ))}
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-7 gap-y-1">
        {calDays.map((day) => {
          const dayTasks = getTasksForDate(day);
          const isSelected = isSameDay(day, selectedDate);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);

          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center py-1.5 rounded-xl transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground"
                  : today
                  ? "bg-primary/10"
                  : "hover:bg-muted"
              } ${!isCurrentMonth ? "opacity-30" : ""}`}
            >
              <span className={`text-xs font-semibold ${
                isSelected ? "" : today ? "text-primary" : ""
              }`}>
                {format(day, "d")}
              </span>
              {dayTasks.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 rounded-full ${
                        isSelected
                          ? "bg-primary-foreground"
                          : taskDotColors[t.task_type] || "bg-muted-foreground"
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
      <div className="pt-2">
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
