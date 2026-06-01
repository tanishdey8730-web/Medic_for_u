const {
  MEDICINES,
  CONDITIONS,
  ALL_SYMPTOMS,
} = require("../data/medicalKnowledge");
const { detectEmergency } = require("./emergencyDetector");
const { researchConditions } = require("./webResearch");
const {
  userWantsMedicines,
  getMedicinesForQuery,
  extractTopicsFromMedicineQuestion,
} = require("./medicineHelper");

function mergeMedicines(existing, extra) {
  const map = new Map();
  for (const m of [...(existing || []), ...(extra || [])]) {
    if (m?.id) map.set(m.id, m);
  }
  return [...map.values()];
}

function extractSymptoms(text) {
  const lower = text.toLowerCase();
  const found = ALL_SYMPTOMS.filter((s) => lower.includes(s));

  const extras = [];
  if (/flu|influenza/i.test(text)) extras.push("fever", "body aches");
  if (/covid|corona/i.test(text)) extras.push("fever", "cough");
  if (/dengue/i.test(text)) extras.push("fever", "headache");
  if (/migraine/i.test(text)) extras.push("headache", "nausea");

  return [...new Set([...found, ...extras])];
}

function scoreCondition(condition, symptoms, text) {
  const lower = text.toLowerCase();
  let matchCount = 0;
  for (const key of condition.symptomKeys) {
    if (symptoms.some((s) => s.includes(key) || key.includes(s))) matchCount++;
    else if (lower.includes(key)) matchCount++;
  }
  if (matchCount < condition.minMatch) return null;

  const ratio = matchCount / condition.symptomKeys.length;
  const pct = Math.min(95, Math.round(condition.pct * (0.7 + ratio * 0.3)));
  return { ...condition, matchScore: matchCount, confidence: pct };
}

function buildPrescription(primaryCondition, allConditions) {
  const medKeys = new Set();
  for (const c of allConditions.slice(0, 2)) {
    (c.medicineKeys || []).forEach((k) => medKeys.add(k));
  }

  const medicines = [...medKeys].map((key) => {
    const m = MEDICINES[key];
    if (!m) return null;
    return {
      id: key,
      name: m.name,
      generic: m.generic,
      type: m.type,
      image: m.image,
      imageFallback: `/assets/medicines/${key}.svg`,
      dosage: m.typicalDose,
      purpose: getPurpose(key, primaryCondition),
      caution: m.caution,
      rxRequired: ["amoxicillin", "azithromycin", "salbutamol", "metformin"].includes(key),
    };
  }).filter(Boolean);

  const duration =
    primaryCondition?.severity === "critical"
      ? "Immediate emergency care"
      : primaryCondition?.id === "flu"
        ? "5–10 days"
        : "3–7 days (reassess if no improvement)";

  return {
    id: `RX-${Date.now().toString(36).toUpperCase()}`,
    date: new Date().toISOString(),
    primaryDiagnosis: primaryCondition?.name || "Symptom-based assessment",
    specialist: primaryCondition?.specialist || "General Physician",
    duration,
    medicines,
    lifestyle: primaryCondition?.treatments || [],
    disclaimer:
      "This is AI-assisted educational guidance only. A licensed physician must verify diagnosis and prescribe medication. Do not start antibiotics without prescription.",
    validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
  };
}

function getPurpose(medKey, condition) {
  const map = {
    paracetamol: "Reduce fever and relieve pain",
    ibuprofen: "Anti-inflammatory pain relief",
    aspirin: "Emergency antiplatelet (cardiac)",
    amoxicillin: "Bacterial infection treatment",
    azithromycin: "Alternative antibiotic coverage",
    cetirizine: "Allergy and cold symptom relief",
    omeprazole: "Reduce stomach acid",
    ors: "Rehydration and electrolyte balance",
    salbutamol: "Relieve bronchospasm / wheezing",
    metformin: "Blood sugar management (prescription)",
    loratadine: "Non-drowsy allergy relief",
  };
  return map[medKey] || "As directed by physician";
}

async function analyzeMedicineQuery(text) {
  const topics = extractTopicsFromMedicineQuestion(text);
  const symptoms = [...new Set([...extractSymptoms(text), ...topics])];
  const medicines = getMedicinesForQuery(text, symptoms, [], { textOnly: true });
  const topicLabel = topics.length
    ? topics.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")
    : "your question";

  const emergency = detectEmergency(text, []);

  let webInsights = [];
  try {
    const wikiTopic = topics[0] === "fever" ? "Fever" : topics[0] || "Over-the-counter drug";
    const { fetchWikipediaSummary } = require("./webResearch");
    const wiki = await fetchWikipediaSummary(wikiTopic);
    if (wiki) {
      webInsights = [
        {
          condition: `Treatment for ${topicLabel}`,
          source: "Wikipedia",
          url: wiki.url,
          summary: wiki.extract,
        },
      ];
    }
  } catch {
    webInsights = [];
  }

  return {
    success: true,
    mode: "medicine",
    analyzedAt: new Date().toISOString(),
    queryText: text,
    inputSymptoms: symptoms,
    diseases: [
      {
        name: `Recommended medicines for ${topicLabel}`,
        pct: 95,
        color: "#00d4aa",
        emergency: false,
      },
    ],
    primaryCondition: null,
    recommendations: [
      `Based on your question: "${text.trim()}"`,
      `${medicines.length} medicine options listed below with real product photos and dosage guidance.`,
      "Consult a doctor if fever lasts more than 3 days, is above 103°F (39.4°C), or you have severe symptoms.",
      "Do not combine multiple fever NSAIDs (ibuprofen + naproxen) without professional advice.",
    ],
    prescription: {
      id: `RX-MED-${Date.now().toString(36).toUpperCase()}`,
      date: new Date().toISOString(),
      primaryDiagnosis: `Medicines for ${topicLabel}`,
      specialist: "General Physician / Pharmacist",
      duration: "Typically 3–5 days for fever (if improving)",
      medicines,
      lifestyle: [
        "Rest and drink plenty of fluids",
        "Monitor temperature every 4–6 hours",
        "Light clothing and lukewarm sponging if needed",
      ],
      disclaimer:
        "Educational OTC guidance from your text prompt only — not a prescription. A doctor must confirm what is safe for you.",
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    },
    wantsMedicines: true,
    emergency,
    webInsights,
    sources: webInsights.map((w) => ({ name: w.source, url: w.url })),
  };
}

async function analyzeSymptoms({ text, selectedSymptoms = [], textOnly = false }) {
  if (userWantsMedicines(text) && (textOnly || selectedSymptoms.length === 0)) {
    return analyzeMedicineQuery(text);
  }

  const chipSymptoms = textOnly ? [] : selectedSymptoms;
  const combined = textOnly ? text : [text, ...chipSymptoms].filter(Boolean).join(" ");
  const symptoms = textOnly
    ? [...new Set([...extractSymptoms(text), ...extractTopicsFromMedicineQuestion(text)])]
    : [
        ...new Set([
          ...extractSymptoms(combined),
          ...chipSymptoms.map((s) => s.toLowerCase()),
        ]),
      ];

  const scored = CONDITIONS.map((c) => scoreCondition(c, symptoms, combined))
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence);

  const diseases = (scored.length ? scored : [
    {
      name: "General Symptom Complex",
      confidence: 45,
      color: "#7a8ba6",
      severity: "low",
      emergency: false,
      commonSymptoms: symptoms.length ? symptoms : ["Unspecified symptoms"],
      treatments: [
        "Monitor symptoms for 24–48 hours",
        "Stay hydrated and rest",
        "Consult a doctor if symptoms worsen or persist >3 days",
      ],
      medicineKeys: ["paracetamol"],
      specialist: "General Physician",
      wikiQuery: "Symptom",
    },
  ]).slice(0, 4).map((c) => ({
    name: c.name,
    pct: c.confidence,
    color: c.color,
    severity: c.severity,
    emergency: c.emergency,
  }));

  const primary = scored[0] || null;
  const emergency = detectEmergency(combined, scored);
  const wantsMedicines = userWantsMedicines(combined);
  let prescription = buildPrescription(primary, scored);

  if (wantsMedicines) {
    const requested = getMedicinesForQuery(combined, symptoms, scored, {
      textOnly: textOnly,
    });
    prescription.medicines = mergeMedicines(prescription.medicines, requested);
    prescription.primaryDiagnosis =
      prescription.medicines.length && !primary
        ? "Medicine recommendation (symptom-based)"
        : prescription.primaryDiagnosis;
  }

  const recs = [];
  if (emergency.isEmergency && emergency.action) recs.push(`🚨 ${emergency.action}`);
  if (wantsMedicines && prescription.medicines.length) {
    recs.push(
      `💊 ${prescription.medicines.length} medicine(s) suggested — verify with your doctor before use.`,
    );
  }
  if (primary) recs.push(...(primary.treatments || []));
  else if (!wantsMedicines) recs.push("Provide more symptom details for a sharper analysis.");

  let webInsights = [];
  try {
    webInsights = await researchConditions(scored.length ? scored : []);
  } catch {
    webInsights = [];
  }

  return {
    success: true,
    analyzedAt: new Date().toISOString(),
    inputSymptoms: symptoms,
    diseases,
    primaryCondition: primary
      ? {
          name: primary.name,
          confidence: primary.confidence,
          commonSymptoms: primary.commonSymptoms,
          treatments: primary.treatments,
          specialist: primary.specialist,
        }
      : null,
    recommendations: recs,
    prescription,
    wantsMedicines,
    emergency,
    webInsights,
    sources: [
      ...webInsights.map((w) => ({ name: w.source, url: w.url })),
      { name: "MediAI Clinical Knowledge Base", url: null },
    ],
  };
}

module.exports = {
  analyzeSymptoms,
  analyzeMedicineQuery,
  extractSymptoms,
  mergeMedicines,
  buildPrescription,
};
