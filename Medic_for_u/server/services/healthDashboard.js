/**
 * Aggregates health data for the personal dashboard.
 */

function computeHealthScore({ abnormalLabs = 0, activeConditions = 0, riskLevel = "low", upcomingAppointments = 0 }) {
  let score = 88;
  score -= abnormalLabs * 6;
  score -= activeConditions * 8;
  if (riskLevel === "moderate") score -= 12;
  if (riskLevel === "high") score -= 25;
  if (riskLevel === "critical") score -= 40;
  if (upcomingAppointments > 0) score += 3;
  return Math.max(15, Math.min(99, Math.round(score)));
}

function riskFromScore(score, abnormalLabs, hasEmergency) {
  if (hasEmergency || score < 40) return { level: "critical", label: "Critical", color: "#ff1744" };
  if (score < 55 || abnormalLabs >= 4) return { level: "high", label: "High", color: "#ff6b6b" };
  if (score < 72 || abnormalLabs >= 2) return { level: "moderate", label: "Moderate", color: "#ffb347" };
  return { level: "low", label: "Low", color: "#00c48c" };
}

function buildTrendSeries(vitals = [], key, fallbackSeed) {
  if (vitals.length) {
    return vitals.slice(-12).map((v) => ({
      date: v.date,
      value: v[key],
    }));
  }
  return fallbackSeed;
}

function extractConditions(prescriptions, labReports, voiceSessions) {
  const conditions = new Set();
  for (const rx of prescriptions.slice(0, 5)) {
    if (rx.primaryDiagnosis) conditions.add(rx.primaryDiagnosis);
  }
  for (const lab of labReports.slice(0, 3)) {
    if (lab.abnormalCount > 0) conditions.add(lab.reportTypeLabel || "Lab abnormality");
  }
  for (const v of voiceSessions.slice(0, 2)) {
    const last = v.messages?.filter((m) => m.role === "assistant").pop();
    if (v.preview) conditions.add("Voice consult: " + v.preview.slice(0, 40));
  }
  if (!conditions.size) conditions.add("No active issues tracked");
  return [...conditions].slice(0, 6);
}

function buildTimeline(events) {
  return events
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 20);
}

function buildDashboard(clientData = {}) {
  const {
    prescriptions = [],
    appointments = [],
    labReports = [],
    voiceHistory = [],
    vitals = [],
  } = clientData;

  const abnormalLabs = labReports.reduce((s, r) => s + (r.abnormalCount || 0), 0);
  const activeConditions = extractConditions(prescriptions, labReports, voiceHistory);
  const upcoming = appointments.filter((a) => new Date(a.date) >= new Date()).length;

  const now = new Date();
  const seed = (base, variance, n = 8) => {
    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      out.push({
        date: d.toISOString().split("T")[0],
        value: Math.round((base + (Math.random() - 0.5) * variance) * 10) / 10,
      });
    }
    return out;
  };

  const healthTrend = buildTrendSeries(vitals, "healthScore", seed(78, 8));
  const weightTrend = buildTrendSeries(vitals, "weight", seed(72, 2));
  const bpTrend = vitals.length
    ? vitals.slice(-12).map((v) => ({
        date: v.date,
        systolic: v.systolic,
        diastolic: v.diastolic,
      }))
    : seed(120, 8).map((p, i) => ({
        date: p.date,
        systolic: 118 + i,
        diastolic: 76 + (i % 3),
      }));
  const sugarTrend = buildTrendSeries(vitals, "bloodSugar", seed(98, 15));

  const score = computeHealthScore({
    abnormalLabs,
    activeConditions: Math.max(0, activeConditions.length - 1),
    riskLevel: "low",
    upcomingAppointments: upcoming,
  });

  const risk = riskFromScore(score, abnormalLabs, false);

  const timeline = buildTimeline([
    ...prescriptions.map((p) => ({
      type: "prescription",
      title: p.primaryDiagnosis || "Prescription",
      date: p.date || p.analyzedAt || new Date().toISOString(),
      icon: "💊",
    })),
    ...appointments.map((a) => ({
      type: "appointment",
      title: `${a.specialist} — ${a.name}`,
      date: a.date,
      icon: "📅",
    })),
    ...labReports.map((l) => ({
      type: "lab",
      title: l.reportTypeLabel || "Lab report",
      date: l.analyzedAt || new Date().toISOString(),
      icon: "📊",
    })),
    ...voiceHistory.map((v) => ({
      type: "voice",
      title: "Voice consultation",
      date: v.updatedAt,
      icon: "🎙️",
    })),
  ]);

  const medicalHistory = [
    ...labReports.map((l) => ({
      category: "Laboratory",
      title: l.reportTypeLabel,
      detail: `${l.totalMarkers} tests · ${l.abnormalCount} abnormal`,
      date: l.analyzedAt,
    })),
    ...prescriptions.map((p) => ({
      category: "Treatment",
      title: p.primaryDiagnosis,
      detail: (p.medicines || []).map((m) => m.name).slice(0, 3).join(", ") || "Medicines advised",
      date: p.date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 12);

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    cards: {
      healthScore: score,
      activeConditions: activeConditions.length,
      activeConditionsList: activeConditions,
      recentPrescriptions: prescriptions.length,
      upcomingAppointments: upcoming,
      totalAppointments: appointments.length,
      risk,
    },
    charts: {
      healthTrend,
      weightTrend,
      bloodPressure: bpTrend,
      bloodSugar: sugarTrend,
    },
    medicalHistory,
    timeline,
    appointmentHistory: appointments.sort((a, b) => new Date(b.date) - new Date(a.date)),
    recentPrescriptions: prescriptions.slice(0, 5),
  };
}

module.exports = { buildDashboard, computeHealthScore, riskFromScore };
