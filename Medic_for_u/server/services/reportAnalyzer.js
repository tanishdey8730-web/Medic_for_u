const { REPORT_TYPES } = require("../data/labReferenceRanges");
const {
  detectReportType,
  parseAllMarkers,
  extractPatientMeta,
  normalizeText,
} = require("./reportParser");

function classifyMarker(marker) {
  const { value, refMin, refMax } = marker;
  let status = "normal";
  let flag = "ok";

  if (value < refMin) {
    status = "low";
    flag = value < refMin * 0.7 ? "critical" : "warning";
  } else if (value > refMax) {
    status = "high";
    flag = value > refMax * 1.5 ? "critical" : "warning";
  }

  const refRange = `${refMin}–${refMax} ${marker.unit}`.replace(/–0 /, "< ");
  return {
    ...marker,
    refRange,
    status,
    flag,
    interpretation: getInterpretation(marker.id, status),
  };
}

function getInterpretation(markerId, status) {
  if (status === "normal") return "Within reference range";
  const map = {
    hemoglobin: { low: "Possible anemia — iron/B12/folate check advised", high: "Polycythemia or dehydration possible" },
    wbc: { low: "Leukopenia — infection or bone marrow review", high: "Possible infection, inflammation, or stress" },
    platelets: { low: "Thrombocytopenia — bleeding risk", high: "Thrombocytosis — inflammation or clotting risk" },
    fasting_glucose: { low: "Hypoglycemia risk", high: "Impaired fasting glucose or diabetes — repeat test" },
    hba1c: { high: "Indicates poor long-term glucose control (diabetes range ≥6.5%)" },
    total_cholesterol: { high: "Cardiovascular risk — diet, exercise, consider statin discussion" },
    ldl: { high: "Elevated bad cholesterol — lifestyle changes recommended" },
    hdl: { low: "Low protective cholesterol — exercise and healthy fats" },
    triglycerides: { high: "Hypertriglyceridemia — reduce sugar/alcohol, exercise" },
    creatinine: { high: "Kidney function concern — hydration and nephrology review" },
    tsh: { high: "Hypothyroidism possible", low: "Hyperthyroidism possible" },
    ast: { high: "Liver enzyme elevation — avoid alcohol, review medications" },
    alt: { high: "Liver injury pattern — hepatitis/fatty liver workup" },
  };
  return map[markerId]?.[status] || `${status === "high" ? "Above" : "Below"} reference — clinical correlation needed`;
}

function buildSummary(reportType, classified, meta) {
  const abnormal = classified.filter((m) => m.status !== "normal");
  const critical = classified.filter((m) => m.flag === "critical");
  const typeLabel = REPORT_TYPES[reportType]?.label || "Lab Report";

  let summary = `AI analysis of your ${typeLabel}. `;
  summary += `${classified.length} parameter(s) detected`;
  if (abnormal.length) summary += `; ${abnormal.length} outside reference range`;
  if (critical.length) summary += ` (${critical.length} need urgent attention)`;
  summary += ".";

  if (meta.patient) summary += ` Patient: ${meta.patient}.`;
  if (meta.reportDate) summary += ` Report date: ${meta.reportDate}.`;

  return summary;
}

function buildRecommendations(reportType, classified) {
  const recs = [
    "Share this report with your doctor for official interpretation.",
    "Reference ranges vary by lab — use your printed report ranges when available.",
  ];
  const abnormal = classified.filter((m) => m.status !== "normal");

  if (!abnormal.length) {
    recs.unshift("All parsed values appear within general reference limits.");
    return recs;
  }

  if (reportType === "blood_sugar" || classified.some((m) => m.id.includes("glucose") || m.id === "hba1c")) {
    recs.push("Monitor diet, exercise regularly, and follow up with HbA1c if glucose is high.");
  }
  if (reportType === "lipid_profile") {
    recs.push("Reduce saturated fats, increase fiber, and consider cardiovascular risk assessment.");
  }
  if (reportType === "cbc" && abnormal.some((m) => m.id === "hemoglobin")) {
    recs.push("Iron-rich diet; doctor may order iron studies or B12/folate levels.");
  }
  if (classified.some((m) => m.flag === "critical")) {
    recs.unshift("⚠️ Some values are critically out of range — seek medical advice promptly.");
  }

  return recs;
}

function analyzeLabReport({ text = "", reportType = "auto", fileName = "" }) {
  const rawText = String(text).trim();
  if (!rawText || rawText.length < 10) {
    return {
      success: false,
      error: "Could not extract enough text from the report. Try a clearer image or PDF.",
    };
  }

  const detectedType = reportType === "auto" ? detectReportType(rawText) : reportType;
  const validType = REPORT_TYPES[detectedType] ? detectedType : detectReportType(rawText);
  const { markers: parsed } = parseAllMarkers(rawText, validType);
  const meta = extractPatientMeta(rawText);

  if (!parsed.length) {
    return {
      success: false,
      error: "No lab values recognized. Select report type manually or upload a clearer scan.",
      extractedPreview: normalizeText(rawText).slice(0, 300),
      suggestedTypes: Object.values(REPORT_TYPES).map((t) => ({ id: t.id, label: t.label })),
    };
  }

  const classified = parsed.map(classifyMarker);
  const abnormalCount = classified.filter((m) => m.status !== "normal").length;

  return {
    success: true,
    id: `LAB-${Date.now().toString(36).toUpperCase()}`,
    analyzedAt: new Date().toISOString(),
    fileName,
    reportType: validType,
    reportTypeLabel: REPORT_TYPES[validType].label,
    patientMeta: meta,
    markers: classified,
    summary: buildSummary(validType, classified, meta),
    recommendations: buildRecommendations(validType, classified),
    abnormalCount,
    totalMarkers: classified.length,
    disclaimer:
      "AI-assisted lab report parsing for education only. OCR may misread values — always verify against your original report and physician.",
  };
}

module.exports = { analyzeLabReport, classifyMarker };
