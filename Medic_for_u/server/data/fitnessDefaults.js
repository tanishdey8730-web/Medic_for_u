const DEFAULT_GOALS = {
  steps: 10000,
  waterMl: 2500,
  sleepHours: 8,
  caloriesBurned: 400,
  weightKg: null,
};

const MILESTONE_DEFS = [
  { id: "first_log", title: "First Log", desc: "Log fitness data for the first time", icon: "🎯" },
  { id: "steps_10k_day", title: "10K Steps", desc: "Hit 10,000 steps in one day", icon: "👟", metric: "steps", threshold: 10000 },
  { id: "steps_100k_total", title: "100K Steps", desc: "100,000 total steps logged", icon: "🏃", metric: "totalSteps", threshold: 100000 },
  { id: "water_goal_week", title: "Hydration Hero", desc: "Meet water goal 7 days in a row", icon: "💧", streak: "water", days: 7 },
  { id: "sleep_8h", title: "Well Rested", desc: "Log 8+ hours of sleep", icon: "😴", metric: "sleepHours", threshold: 8 },
  { id: "streak_7", title: "7-Day Streak", desc: "Log activity 7 days in a row", icon: "🔥", streak: "log", days: 7 },
  { id: "streak_30", title: "30-Day Streak", desc: "Log activity 30 days in a row", icon: "⭐", streak: "log", days: 30 },
  { id: "calories_500", title: "Calorie Crusher", desc: "Burn 500+ calories in a day", icon: "🔥", metric: "caloriesBurned", threshold: 500 },
  { id: "weight_log_10", title: "Scale Regular", desc: "Log weight 10 times", icon: "⚖️", metric: "weightLogs", threshold: 10 },
];

module.exports = { DEFAULT_GOALS, MILESTONE_DEFS };
