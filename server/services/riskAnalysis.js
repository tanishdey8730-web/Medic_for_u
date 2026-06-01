/**
 * AI Health Risk Prediction — evidence-informed scoring (educational use only).
 */

function calcBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm) return null;
  const h = heightCm / 100;
  return Math.round((weightKg / (h * h)) * 10) / 10;
}

function categoryFromPercent(pct) {
  if (pct < 25) return { level: "low", label: "Low Risk", color: "#00c48c" };
  if (pct < 50) return { level: "moderate", label: "Moderate Risk", color: "#ffb347" };
  if (pct < 75) return { level: "high", label: "High Risk", color: "#ff6b6b" };
  return { level: "very_high", label: "Very High Risk", color: "#ff1744" };
}

const PREVENTION = {
  diabetes: {
    low: ["Maintain healthy weight", "Annual fasting glucose check", "Stay physically active 150 min/week"],
    moderate: ["Reduce sugary drinks and refined carbs", "Walk 30 minutes daily", "Recheck blood sugar in 3–6 months"],
    high: ["Consult doctor for HbA1c testing", "Structured diet plan (low GI foods)", "Target 5–7% weight loss if overweight"],
    very_high: ["Urgent medical evaluation recommended", "Screen for prediabetes/diabetes now", "Do not ignore frequent thirst or urination"],
  },
  heart: {
    low: ["Heart-healthy diet (vegetables, whole grains)", "Regular cardio exercise", "Know your blood pressure yearly"],
    moderate: ["Limit saturated fat and salt", "Monitor BP at home", "Discuss family history with physician"],
    high: ["Lipid profile and ECG if not done recently", "Quit smoking if applicable", "Manage stress and sleep"],
    very_high: ["Seek cardiology assessment", "Call emergency services for chest pain", "Strict BP and sugar control"],
  },
  hypertension: {
    low: ["Limit sodium under 2g/day", "Regular aerobic activity", "Maintain healthy BMI"],
    moderate: ["DASH-style diet (fruits, vegetables)", "Reduce alcohol", "Home BP monitoring twice weekly"],
    high: ["Medical review for antihypertensive need", "Daily BP log", "Reduce processed foods"],
    very_high: ["See doctor within days for BP management", "Very low salt diet", "Avoid heavy lifting until controlled"],
  },
  obesity: {
    low: ["Balanced diet with portion control", "Stay active", "Annual BMI check"],
    moderate: ["Aim for 0.5 kg/week loss if overweight", "Strength + cardio mix", "Track calories loosely"],
    high: ["Nutritionist or physician weight plan", "Target 5–10% body weight reduction", "Reduce sedentary time"],
    very_high: ["Medical evaluation for metabolic syndrome", "Structured weight-loss program", "Screen for diabetes and lipids"],
  },
};

function tipsFor(riskKey, catLevel) {
  const set = PREVENTION[riskKey];
  const key = ["low", "moderate", "high", "very_high"].includes(catLevel) ? catLevel : "moderate";
  return set[key] || set.moderate;
}

function scoreDiabetes({ age, bmi, bloodSugar, familyDiabetes, exercise, diet }) {
  let score = 8;
  if (age >= 45) score += 12;
  else if (age >= 35) score += 6;
  if (bmi >= 30) score += 22;
  else if (bmi >= 25) score += 12;
  else if (bmi >= 23) score += 5;
  if (bloodSugar >= 126) score += 35;
  else if (bloodSugar >= 100) score += 20;
  else if (bloodSugar >= 90) score += 8;
  if (familyDiabetes) score += 15;
  if (exercise === "sedentary") score += 12;
  else if (exercise === "moderate") score += 4;
  if (diet === "poor") score += 10;
  else if (diet === "moderate") score += 4;
  return Math.min(95, Math.round(score));
}

function scoreHeart({ age, gender, bmi, systolic, diastolic, bloodSugar, smoking, familyHeart, exercise }) {
  let score = 10;
  if (age >= 55) score += 15;
  else if (age >= 45) score += 8;
  if (gender === "male" && age >= 45) score += 5;
  if (systolic >= 140 || diastolic >= 90) score += 22;
  else if (systolic >= 130 || diastolic >= 85) score += 12;
  if (bmi >= 30) score += 10;
  if (smoking) score += 20;
  if (familyHeart) score += 14;
  if (bloodSugar >= 100) score += 8;
  if (exercise === "sedentary") score += 10;
  return Math.min(95, Math.round(score));
}

function scoreHypertension({ age, bmi, systolic, diastolic, smoking, alcohol, stress, diet, familyHeart }) {
  let score = 5;
  if (systolic >= 140 || diastolic >= 90) score += 40;
  else if (systolic >= 130 || diastolic >= 80) score += 25;
  else if (systolic >= 120) score += 10;
  if (age >= 50) score += 10;
  else if (age >= 40) score += 5;
  if (bmi >= 30) score += 15;
  else if (bmi >= 25) score += 8;
  if (smoking) score += 8;
  if (alcohol === "heavy") score += 10;
  else if (alcohol === "moderate") score += 4;
  if (stress === "high") score += 8;
  if (diet === "poor") score += 12;
  if (familyHeart) score += 6;
  return Math.min(95, Math.round(score));
}

function scoreObesity({ bmi, age, exercise, diet }) {
  if (bmi == null) return 15;
  let score = 0;
  if (bmi >= 40) score = 88;
  else if (bmi >= 35) score = 75;
  else if (bmi >= 30) score = 62;
  else if (bmi >= 25) score = 38;
  else if (bmi >= 23) score = 18;
  else score = 8;
  if (exercise === "sedentary") score += 10;
  if (diet === "poor") score += 8;
  if (age < 18) score = Math.max(5, score - 15);
  return Math.min(95, Math.round(score));
}

function buildRiskResult(id, name, icon, percent, riskKey) {
  const cat = categoryFromPercent(percent);
  return {
    id,
    name,
    icon,
    percent,
    category: cat.label,
    level: cat.level,
    color: cat.color,
    preventionTips: tipsFor(riskKey, cat.level),
  };
}

function analyzeHealthRisks(input) {
  const age = Math.max(1, Math.min(120, Number(input.age) || 30));
  const gender = String(input.gender || "other").toLowerCase();
  const weight = Number(input.weight) || 70;
  const height = Number(input.height) || 170;
  const systolic = Number(input.systolic) || 120;
  const diastolic = Number(input.diastolic) || 80;
  const bloodSugar = Number(input.bloodSugar) || 95;

  const lifestyle = input.lifestyle || {};
  const smoking = Boolean(lifestyle.smoking);
  const alcohol = lifestyle.alcohol || "none";
  const exercise = lifestyle.exercise || "moderate";
  const diet = lifestyle.diet || "moderate";
  const stress = lifestyle.stress || "low";
  const familyDiabetes = Boolean(lifestyle.familyDiabetes);
  const familyHeart = Boolean(lifestyle.familyHeart);

  const bmi = calcBMI(weight, height);
  const ctx = {
    age,
    gender,
    bmi,
    systolic,
    diastolic,
    bloodSugar,
    smoking,
    alcohol,
    exercise,
    diet,
    stress,
    familyDiabetes,
    familyHeart,
  };

  const risks = [
    buildRiskResult("diabetes", "Diabetes Risk", "🍬", scoreDiabetes(ctx), "diabetes"),
    buildRiskResult("heart", "Heart Disease Risk", "❤️", scoreHeart(ctx), "heart"),
    buildRiskResult("hypertension", "Hypertension Risk", "🩸", scoreHypertension(ctx), "hypertension"),
    buildRiskResult("obesity", "Obesity Risk", "⚖️", scoreObesity(ctx), "obesity"),
  ];

  const overallPercent = Math.round(
    risks.reduce((s, r) => s + r.percent, 0) / risks.length,
  );
  const overallCategory = categoryFromPercent(overallPercent);

  const topRisk = [...risks].sort((a, b) => b.percent - a.percent)[0];

  return {
    success: true,
    id: `RISK-${Date.now().toString(36).toUpperCase()}`,
    analyzedAt: new Date().toISOString(),
    inputs: {
      age,
      gender,
      weight,
      height,
      bmi,
      systolic,
      diastolic,
      bloodSugar,
      lifestyle: { smoking, alcohol, exercise, diet, stress, familyDiabetes, familyHeart },
    },
    risks,
    overall: {
      percent: overallPercent,
      category: overallCategory.label,
      level: overallCategory.level,
      color: overallCategory.color,
      topConcern: topRisk.name,
    },
    summary: `Based on your profile (age ${age}, BMI ${bmi ?? "N/A"}, BP ${systolic}/${diastolic}, glucose ${bloodSugar} mg/dL), your highest predicted risk is ${topRisk.name} at ${topRisk.percent}%. Overall composite risk is ${overallPercent}% (${overallCategory.label}).`,
    disclaimer:
      "This AI risk model is for educational screening only — not a medical diagnosis. Consult a qualified healthcare provider for clinical assessment.",
  };
}

function buildTrendFromHistory(history = []) {
  return history.slice(-10).map((h) => ({
    date: h.analyzedAt?.split("T")[0] || h.date,
    diabetes: h.risks?.find((r) => r.id === "diabetes")?.percent ?? 0,
    heart: h.risks?.find((r) => r.id === "heart")?.percent ?? 0,
    hypertension: h.risks?.find((r) => r.id === "hypertension")?.percent ?? 0,
    obesity: h.risks?.find((r) => r.id === "obesity")?.percent ?? 0,
    overall: h.overall?.percent ?? 0,
  }));
}

module.exports = { analyzeHealthRisks, buildTrendFromHistory, calcBMI, categoryFromPercent };
