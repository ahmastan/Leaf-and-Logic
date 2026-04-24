import React from "react";
import { Check, Droplets, Scissors, Flower2, Bug, RotateCcw, Beaker } from "lucide-react";
import { format, isToday, isPast, isTomorrow } from "date-fns";
import { motion } from "framer-motion";

const taskIcons = {
  watering: Droplets,
  fertilizing: Beaker,
  pruning: Scissors,
  repotting: Flower2,
  pest_check: Bug,
  rotation: RotateCcw,
};

const taskColors = {
  watering: "bg-blue-50 text-blue-600 border-blue-100",
  fertilizing: "bg-amber-50 text-amber-600 border-amber-100",
  pruning: "bg-emerald-50 text-emerald-600 border-emerald-100",
  repotting: "bg-orange-50 text-orange-600 border-orange-100",
  pest_check: "bg-red-50 text-red-600 border-red-100",
  rotation: "bg-purple-50 text-purple-600 border-purple-100",
};

export default function TodaysTasks({ tasks, onComplete, isLoading }) {
  const todayTasks = tasks.filter(
    (t) => !t.completed && t.due_date && (isToday(new Date(t.due_date)) || isPast(new Date(t.due_date)))
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    );
  }

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-3">
          <Check className="w-8 h-8 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">All caught up! No tasks for today.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {todayTasks.map((task, idx) => {
        const Icon = taskIcons[task.task_type] || Droplets;
        const colors = taskColors[task.task_type] || taskColors.watering;
        const isOverdue = isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

        return (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`flex items-center gap-3 p-3.5 rounded-2xl border bg-card transition-all ${
              isOverdue ? "border-destructive/30" : "border-border"
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colors}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{task.plant_name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {task.task_type.replace("_", " ")}
                {isOverdue && <span className="text-destructive ml-1">• Overdue</span>}
              </p>
            </div>
            <button
              onClick={() => onComplete(task)}
              className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all active:scale-90"
            >
              <Check className="w-4 h-4" />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}