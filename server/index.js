const path = require("path");
const express = require("express");
const cors = require("cors");
const {
  analyzeSymptoms,
  analyzeMedicineQuery,
  mergeMedicines,
} = require("./services/medicalEngine");
const { parsePrescriptionText } = require("./services/prescriptionParser");
const { getMedicinesForQuery } = require("./services/medicineHelper");
const { analyzeLabReport } = require("./services/reportAnalyzer");
const { REPORT_TYPES } = require("./data/labReferenceRanges");
const { processVoiceConsultation } = require("./services/voiceDoctor");
const { buildDashboard } = require("./services/healthDashboard");
const { analyzeHealthRisks, buildTrendFromHistory } = require("./services/riskAnalysis");
const {
  analyzeDrugInteraction,
  searchMedicines,
} = require("./services/drugInteractionChecker");
const {
  processMedicineScan,
  searchMedicineDatabase,
} = require("./services/medicineScanner");
const { generateDietPlan } = require("./services/dietPlanner");
const {
  buildFitnessDashboard,
  logFitnessEntry,
  DEFAULT_GOALS,
} = require("./services/fitnessTracker");

const app = express();
const PORT = process.env.PORT || 3001;

const prescriptionHistory = [];
const userAppointments = [];
const labReportHistory = [];

app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(express.static(path.join(__dirname, "..")));

app.get("/api/medicines/images", (_req, res) => {
  const { MEDICINES, medicineImagePath } = require("./data/medicalKnowledge");
  const catalog = Object.entries(MEDICINES).map(([id, m]) => ({
    id,
    name: m.name,
    image: medicineImagePath(id),
  }));
  res.json({ catalog });
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "MediAI Backend",
    version: "2.0.0",
    features: [
      "diagnosis",
      "prescription",
      "prescription-upload",
      "medicine-on-demand",
      "web-research",
      "emergency-detection",
      "lab-report-analyzer",
      "voice-ai-doctor",
      "health-dashboard",
      "risk-prediction",
      "drug-interaction-checker",
      "medicine-scanner",
      "ai-diet-planner",
      "fitness-health-tracker",
    ],
  });
});

app.get("/api/fitness/goals", (_req, res) => {
  res.json({ goals: DEFAULT_GOALS });
});

app.post("/api/fitness/log", (req, res) => {
  try {
    const { logs = [], entry = {}, goals = {} } = req.body || {};
    const result = logFitnessEntry({ logs, entry, goals });
    res.json(result);
  } catch (err) {
    console.error("Fitness log error:", err);
    res.status(500).json({ success: false, error: "Failed to log fitness data." });
  }
});

app.post("/api/fitness/dashboard", (req, res) => {
  try {
    const { logs = [], goals = {} } = req.body || {};
    const result = buildFitnessDashboard({ logs, goals });
    res.json(result);
  } catch (err) {
    console.error("Fitness dashboard error:", err);
    res.status(500).json({ success: false, error: "Fitness dashboard failed." });
  }
});

app.post("/api/diet-plan", (req, res) => {
  try {
    const result = generateDietPlan(req.body || {});
    res.json(result);
  } catch (err) {
    console.error("Diet plan error:", err);
    res.status(500).json({ success: false, error: "Diet plan generation failed." });
  }
});

app.get("/api/medicine-scan/search", (req, res) => {
  try {
    const q = String(req.query.q || "");
    res.json({ results: searchMedicineDatabase(q) });
  } catch (err) {
    console.error("Medicine scan search error:", err);
    res.status(500).json({ success: false, error: "Search failed." });
  }
});

app.post("/api/medicine-scan", (req, res) => {
  try {
    const { ocrText = "", medicineName = "", medicineId = null } = req.body || {};
    const result = processMedicineScan({ ocrText, medicineName, medicineId });
    res.json(result);
  } catch (err) {
    console.error("Medicine scan error:", err);
    res.status(500).json({ success: false, error: "Medicine scan failed." });
  }
});

app.get("/api/drug-interaction/search", (req, res) => {
  try {
    const q = String(req.query.q || "");
    res.json({ results: searchMedicines(q) });
  } catch (err) {
    console.error("Drug search error:", err);
    res.status(500).json({ ok: false, error: "Search failed." });
  }
});

app.post("/api/drug-interaction", (req, res) => {
  try {
    const { medicines = [], allergies = [] } = req.body || {};
    const result = analyzeDrugInteraction({ medicines, allergies });
    if (!result.ok) {
      return res.status(400).json(result);
    }
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("Drug interaction error:", err);
    res.status(500).json({ success: false, error: "Drug interaction check failed." });
  }
});

app.post("/api/risk-analysis", (req, res) => {
  try {
    const result = analyzeHealthRisks(req.body || {});
    const history = Array.isArray(req.body.history) ? req.body.history : [];
    result.trend = buildTrendFromHistory([...history, result]);
    res.json(result);
  } catch (err) {
    console.error("Risk analysis error:", err);
    res.status(500).json({ success: false, error: "Risk analysis failed." });
  }
});

app.post("/api/dashboard", (req, res) => {
  try {
    const payload = buildDashboard(req.body || {});
    res.json(payload);
  } catch (err) {
    console.error("Dashboard error:", err);
    res.status(500).json({ success: false, error: "Dashboard generation failed." });
  }
});

app.post("/api/voice-consultation", async (req, res) => {
  try {
    const {
      sessionId = null,
      message = "",
      language = "en",
      action = "message",
    } = req.body;

    const result = await processVoiceConsultation({
      sessionId: sessionId ? String(sessionId) : null,
      message: String(message),
      language: String(language),
      action: String(action),
    });

    res.json(result);
  } catch (err) {
    console.error("Voice consultation error:", err);
    res.status(500).json({
      success: false,
      error: "Voice consultation failed. Please try again.",
    });
  }
});

app.get("/api/reports/types", (_req, res) => {
  res.json({
    types: Object.values(REPORT_TYPES).map((t) => ({ id: t.id, label: t.label })),
  });
});

app.post("/api/reports/analyze", (req, res) => {
  try {
    const {
      text = "",
      reportType = "auto",
      fileName = "",
      mimeType = "",
      imageDataUrl = null,
    } = req.body;

    const result = analyzeLabReport({
      text: String(text),
      reportType: String(reportType),
      fileName: String(fileName),
    });

    if (result.success) {
      result.uploadMeta = {
        fileName,
        mimeType,
        imagePreview: imageDataUrl && String(mimeType).startsWith("image/") ? imageDataUrl : null,
      };
      labReportHistory.unshift(result);
      if (labReportHistory.length > 30) labReportHistory.pop();
    }

    res.json(result);
  } catch (err) {
    console.error("Report analyze error:", err);
    res.status(500).json({ success: false, error: "Lab report analysis failed." });
  }
});

app.get("/api/reports", (_req, res) => {
  res.json({ reports: labReportHistory });
});

app.post("/api/medicines/recommend", async (req, res) => {
  try {
    const { text = "" } = req.body;
    if (!text.trim()) {
      return res.status(400).json({ success: false, error: "Provide your medicine question." });
    }
    const result = await analyzeMedicineQuery(String(text));
    prescriptionHistory.unshift(result.prescription);
    res.json(result);
  } catch (err) {
    console.error("Medicine recommend error:", err);
    res.status(500).json({ success: false, error: "Could not recommend medicines." });
  }
});

app.post("/api/analyze", async (req, res) => {
  try {
    const { text = "", symptoms = [], textOnly = false } = req.body;
    if (!text.trim() && !symptoms.length) {
      return res.status(400).json({
        success: false,
        error: "Provide symptom description or selected symptoms.",
      });
    }

    const result = await analyzeSymptoms({
      text: String(text),
      selectedSymptoms: Array.isArray(symptoms) ? symptoms : [],
      textOnly: Boolean(textOnly),
    });

    prescriptionHistory.unshift(result.prescription);
    if (prescriptionHistory.length > 50) prescriptionHistory.pop();

    res.json(result);
  } catch (err) {
    console.error("Analyze error:", err);
    res.status(500).json({
      success: false,
      error: "Analysis failed. Please try again.",
    });
  }
});

app.post("/api/prescription/upload", async (req, res) => {
  try {
    const {
      fileName = "prescription",
      mimeType = "",
      textContent = "",
      userNote = "",
      imageDataUrl = null,
    } = req.body;

    const combinedText = [textContent, userNote, fileName.replace(/\.[^.]+$/, " ")]
      .filter(Boolean)
      .join("\n");

    const parsed = parsePrescriptionText(combinedText);
    let analysis = null;

    if (userNote.trim() || textContent.trim()) {
      analysis = await analyzeSymptoms({
        text: [userNote, textContent].filter(Boolean).join(" "),
        selectedSymptoms: [],
      });
    }

    let medicines = parsed.medicines;
    if (analysis?.prescription?.medicines?.length) {
      medicines = mergeMedicines(medicines, analysis.prescription.medicines);
    }
    if (!medicines.length && userNote.trim()) {
      medicines = getMedicinesForQuery(userNote, [], []);
    }

    const prescription = {
      id: `RX-UP-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      primaryDiagnosis: analysis?.primaryCondition?.name || "Uploaded prescription",
      specialist: analysis?.primaryCondition?.specialist || "General Physician",
      duration: analysis?.prescription?.duration || "As directed on prescription",
      medicines,
      lifestyle: analysis?.recommendations || [],
      disclaimer:
        "Parsed from your upload for reference only. Always follow your doctor's written prescription.",
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      uploadMeta: {
        fileName,
        mimeType,
        doctor: parsed.meta.doctor,
        patient: parsed.meta.patient,
        prescriptionDate: parsed.meta.date,
        imagePreview: imageDataUrl && mimeType.startsWith("image/") ? imageDataUrl : null,
      },
    };

    prescriptionHistory.unshift(prescription);

    res.json({
      success: true,
      type: "upload",
      parsed: {
        medicineCount: medicines.length,
        medKeys: parsed.medKeys,
        meta: parsed.meta,
        extractedTextPreview: combinedText.slice(0, 200),
      },
      prescription,
      analysis,
      message:
        medicines.length > 0
          ? `Found ${medicines.length} medicine(s) in your prescription.`
          : "Prescription uploaded. Add a note or use a clearer image/text so we can detect medicine names.",
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ success: false, error: "Could not process prescription upload." });
  }
});

app.get("/api/appointments", (_req, res) => {
  res.json({ appointments: userAppointments });
});

app.post("/api/appointments", (req, res) => {
  const { id, name, specialist, date, time, symptoms, status } = req.body || {};
  if (!name || !date) {
    return res.status(400).json({ error: "Name and date are required." });
  }
  const appt = {
    id: id || `appt-${Date.now()}`,
    name: String(name),
    specialist: String(specialist || "General Physician"),
    date: String(date),
    time: String(time || ""),
    symptoms: String(symptoms || ""),
    status: status || "booked",
    createdAt: new Date().toISOString(),
  };
  const existing = userAppointments.findIndex((a) => a.id === appt.id);
  if (existing >= 0) userAppointments[existing] = appt;
  else userAppointments.unshift(appt);
  res.json({ success: true, appointment: appt });
});

app.delete("/api/appointments/:id", (req, res) => {
  const idx = userAppointments.findIndex((a) => a.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: "Appointment not found" });
  userAppointments.splice(idx, 1);
  res.json({ success: true });
});

app.get("/api/prescriptions", (_req, res) => {
  res.json({ prescriptions: prescriptionHistory });
});

app.get("/api/prescriptions/:id", (req, res) => {
  const rx = prescriptionHistory.find((p) => p.id === req.params.id);
  if (!rx) return res.status(404).json({ error: "Prescription not found" });
  res.json(rx);
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(`MediAI server running at http://localhost:${PORT}`);
});
