const { DEFAULT_GOALS, MILESTONE_DEFS } = require("../data/fitnessDefaults");

function todayISO() {
  return new Date().toISOString().split("T")[0];
}

function parseDate(str) {
  const d = new Date(str + "T12:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizeLog(raw) {
  if (!raw || !raw.date) return null;
  return {
    date: String(raw.date).slice(0, 10),
    steps: Math.max(0, Number(raw.steps) || 0),
    waterMl: Math.max(0, Number(raw.waterMl) || 0),
    sleepHours: Math.max(0, Math.min(24, Number(raw.sleepHours) || 0)),
    caloriesBurned: Math.max(0, Number(raw.caloriesBurned) || 0),
    weightKg: raw.weightKg != null && raw.weightKg !== "" ? Number(raw.weightKg) : null,
  };
}

function mergeLogs(existing = [], entry) {
  const norm = normalizeLog(entry);
  if (!norm) return existing;
  const map = new Map();
  for (const l of existing) {
    const n = normalizeLog(l);
    if (n) map.set(n.date, n);
  }
  const prev = map.get(norm.date) || {};
  map.set(norm.date, {
    date: norm.date,
    steps: norm.steps || prev.steps || 0,
    waterMl: norm.waterMl || prev.waterMl || 0,
    sleepHours: norm.sleepHours || prev.sleepHours || 0,
    caloriesBurned: norm.caloriesBurned || prev.caloriesBurned || 0,
    weightKg: norm.weightKg ?? prev.weightKg ?? null,
  });
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function goalProgress(value, goal) {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((value / goal) * 100));
}

function avg(arr) {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0);
}

function logsInRange(logs, daysBack, endDate = todayISO()) {
  const end = parseDate(endDate);
  if (!end) return [];
  const start = new Date(end);
  start.setDate(start.getDate() - daysBack + 1);
  const startStr = start.toISOString().split("T")[0];
  return logs.filter((l) => l.date >= startStr && l.date <= endDate);
}

function buildDailyReport(log, goals) {
  if (!log) {
    return {
      date: todayISO(),
      hasData: false,
      metrics: {},
      overallProgress: 0,
    };
  }
  const metrics = {
    steps: {
      value: log.steps,
      goal: goals.steps,
      progress: goalProgress(log.steps, goals.steps),
      unit: "steps",
    },
    water: {
      value: log.waterMl,
      goal: goals.waterMl,
      progress: goalProgress(log.waterMl, goals.waterMl),
      unit: "ml",
    },
    sleep: {
      value: log.sleepHours,
      goal: goals.sleepHours,
      progress: goalProgress(log.sleepHours, goals.sleepHours),
      unit: "hrs",
    },
    calories: {
      value: log.caloriesBurned,
      goal: goals.caloriesBurned,
      progress: goalProgress(log.caloriesBurned, goals.caloriesBurned),
      unit: "kcal",
    },
    weight: {
      value: log.weightKg,
      goal: goals.weightKg,
      progress: log.weightKg && goals.weightKg ? 100 : 0,
      unit: "kg",
    },
  };
  const progresses = ["steps", "water", "sleep", "calories"].map((k) => metrics[k].progress);
  return {
    date: log.date,
    hasData: true,
    metrics,
    overallProgress: Math.round(avg(progresses)),
  };
}

function buildPeriodReport(logs, goals, label) {
  if (!logs.length) {
    return {
      label,
      days: 0,
      totals: { steps: 0, waterMl: 0, caloriesBurned: 0 },
      averages: { steps: 0, waterMl: 0, sleepHours: 0, caloriesBurned: 0, weightKg: null },
      goalsMetDays: { steps: 0, water: 0, sleep: 0, calories: 0 },
    };
  }
  const weights = logs.map((l) => l.weightKg).filter((w) => w != null);
  let stepsMet = 0;
  let waterMet = 0;
  let sleepMet = 0;
  let calMet = 0;
  for (const l of logs) {
    if (l.steps >= goals.steps) stepsMet++;
    if (l.waterMl >= goals.waterMl) waterMet++;
    if (l.sleepHours >= goals.sleepHours) sleepMet++;
    if (l.caloriesBurned >= goals.caloriesBurned) calMet++;
  }
  return {
    label,
    days: logs.length,
    totals: {
      steps: sum(logs.map((l) => l.steps)),
      waterMl: sum(logs.map((l) => l.waterMl)),
      caloriesBurned: sum(logs.map((l) => l.caloriesBurned)),
    },
    averages: {
      steps: Math.round(avg(logs.map((l) => l.steps))),
      waterMl: Math.round(avg(logs.map((l) => l.waterMl))),
      sleepHours: avg(logs.map((l) => l.sleepHours)),
      caloriesBurned: Math.round(avg(logs.map((l) => l.caloriesBurned))),
      weightKg: weights.length ? avg(weights) : null,
    },
    goalsMetDays: { steps: stepsMet, water: waterMet, sleep: sleepMet, calories: calMet },
    chartSeries: logs.map((l) => ({
      date: l.date,
      steps: l.steps,
      waterMl: l.waterMl,
      sleepHours: l.sleepHours,
      caloriesBurned: l.caloriesBurned,
      weightKg: l.weightKg,
    })),
  };
}

function calcStreak(logs, predicate) {
  const byDate = new Map(logs.map((l) => [l.date, l]));

  function countFromOffset(offsetDays) {
    let streak = 0;
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    for (let i = 0; i < 400; i++) {
      const key = d.toISOString().split("T")[0];
      const log = byDate.get(key);
      if (!log || !predicate(log)) return streak;
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  const fromToday = countFromOffset(0);
  if (fromToday > 0) return fromToday;
  return countFromOffset(1);
}

function calcLogStreak(logs) {
  return calcStreak(
    logs,
    (l) => l.steps > 0 || l.waterMl > 0 || l.sleepHours > 0 || l.caloriesBurned > 0
  );
}

function evaluateMilestones(logs, goals, streaks) {
  const totalSteps = sum(logs.map((l) => l.steps));
  const weightLogs = logs.filter((l) => l.weightKg != null).length;
  const unlocked = [];

  for (const m of MILESTONE_DEFS) {
    let earned = false;
    if (m.id === "first_log" && logs.length >= 1) earned = true;
    if (m.metric === "steps" && m.threshold && logs.some((l) => l.steps >= m.threshold)) earned = true;
    if (m.metric === "sleepHours" && logs.some((l) => l.sleepHours >= m.threshold)) earned = true;
    if (m.metric === "caloriesBurned" && logs.some((l) => l.caloriesBurned >= m.threshold)) earned = true;
    if (m.metric === "totalSteps" && totalSteps >= m.threshold) earned = true;
    if (m.metric === "weightLogs" && weightLogs >= m.threshold) earned = true;
    if (m.streak === "water" && streaks.water >= (m.days || 7)) earned = true;
    if (m.streak === "log" && streaks.log >= (m.days || 7)) earned = true;
    unlocked.push({ ...m, earned });
  }
  return unlocked;
}

function buildFitnessDashboard({ logs: rawLogs = [], goals: rawGoals = {} } = {}) {
  const logs = rawLogs.map(normalizeLog).filter(Boolean);
  const goals = { ...DEFAULT_GOALS, ...rawGoals };

  const today = todayISO();
  const todayLog = logs.find((l) => l.date === today) || null;

  const daily = buildDailyReport(todayLog, goals);
  const weekly = buildPeriodReport(logsInRange(logs, 7), goals, "Last 7 days");
  const monthly = buildPeriodReport(logsInRange(logs, 30), goals, "Last 30 days");

  const streaks = {
    log: calcLogStreak(logs),
    steps: calcStreak(logs, (l) => l.steps >= goals.steps),
    water: calcStreak(logs, (l) => l.waterMl >= goals.waterMl),
    sleep: calcStreak(logs, (l) => l.sleepHours >= goals.sleepHours),
  };

  const milestones = evaluateMilestones(logs, goals, streaks);
  const earnedCount = milestones.filter((m) => m.earned).length;

  return {
    success: true,
    goals,
    today: todayLog,
    dailyProgress: daily,
    weeklyReport: weekly,
    monthlyReport: monthly,
    streaks,
    achievements: {
      streaks,
      milestones,
      earnedCount,
      totalMilestones: milestones.length,
      goals: {
        steps: { current: todayLog?.steps || 0, target: goals.steps, progress: daily.metrics?.steps?.progress || 0 },
        water: { current: todayLog?.waterMl || 0, target: goals.waterMl, progress: daily.metrics?.water?.progress || 0 },
        sleep: { current: todayLog?.sleepHours || 0, target: goals.sleepHours, progress: daily.metrics?.sleep?.progress || 0 },
        calories: { current: todayLog?.caloriesBurned || 0, target: goals.caloriesBurned, progress: daily.metrics?.calories?.progress || 0 },
      },
    },
    logsCount: logs.length,
    generatedAt: new Date().toISOString(),
  };
}

function logFitnessEntry({ logs = [], entry, goals = {} } = {}) {
  const merged = mergeLogs(logs, entry);
  const dashboard = buildFitnessDashboard({ logs: merged, goals });
  return { ...dashboard, logs: merged };
}

module.exports = {
  buildFitnessDashboard,
  logFitnessEntry,
  mergeLogs,
  normalizeLog,
  DEFAULT_GOALS,
};
