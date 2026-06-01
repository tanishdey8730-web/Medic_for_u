const { MEDICINES, getMedicineImage, medicineImagePath } = require("../data/medicalKnowledge");
const { DRUG_PROFILES, SEARCH_ALIASES } = require("../data/drugInteractionData");
const { MEDICINE_USES, SCANNER_PROFILE_FALLBACK } = require("../data/medicineScannerData");
const {
  findMedicinesInText,
  MEDICINE_ALIASES,
} = require("./prescriptionParser");
const { normalizeDrugName, searchMedicines } = require("./drugInteractionChecker");

function resolveMedicineId(input) {
  if (!input) return null;
  if (typeof input === "string" && MEDICINES[input]) return input;
  const fromNorm = normalizeDrugName(String(input));
  if (fromNorm) return fromNorm;
  const lower = String(input).toLowerCase();
  for (const [id, aliases] of Object.entries(MEDICINE_ALIASES)) {
    if (aliases.some((a) => lower.includes(a) || a.includes(lower))) return id;
  }
  return null;
}

function extractMedicineNamesFromOcr(ocrText) {
  const text = (ocrText || "").trim();
  if (!text) return { ids: [], rawText: "" };
  const ids = findMedicinesInText(text);
  return { ids, rawText: text.slice(0, 8000) };
}

function buildAlternativeList(id) {
  const profile = DRUG_PROFILES[id];
  const fallback = SCANNER_PROFILE_FALLBACK[id];
  const altIds = profile?.alternatives || [];
  return altIds
    .filter((aid) => MEDICINES[aid])
    .map((aid) => ({
      id: aid,
      name: MEDICINES[aid].name,
      type: MEDICINES[aid].type,
    }));
}

function buildMedicineProfile(id) {
  const med = MEDICINES[id];
  if (!med) return null;

  const drugProfile = DRUG_PROFILES[id] || {};
  const fallback = SCANNER_PROFILE_FALLBACK[id] || {};

  return {
    id,
    name: med.name,
    generic: med.generic,
    type: med.type,
    image: getMedicineImage(id),
    imageFallback: medicineImagePath(id),
    uses: MEDICINE_USES[id] || [med.type],
    dosage: med.typicalDose,
    sideEffects: drugProfile.sideEffects || fallback.sideEffects || [],
    warnings: [
      med.caution,
      ...(drugProfile.contraindications || fallback.contraindications || []),
    ].filter(Boolean),
    contraindications: drugProfile.contraindications || fallback.contraindications || [],
    alternatives: buildAlternativeList(id),
    rxRequired: ["amoxicillin", "azithromycin", "salbutamol", "metformin", "diclofenac"].includes(id),
  };
}

function searchMedicineDatabase(query, limit = 15) {
  return searchMedicines(query, limit).map((r) => {
    const full = buildMedicineProfile(r.id);
    return full
      ? {
          id: r.id,
          name: r.name,
          class: r.class,
          uses: full.uses.slice(0, 2),
        }
      : r;
  });
}

function processMedicineScan({ ocrText = "", medicineName = "", medicineId = null } = {}) {
  const detectedIds = new Set();

  if (medicineId && MEDICINES[medicineId]) detectedIds.add(medicineId);

  const manualId = resolveMedicineId(medicineName || medicineId);
  if (manualId) detectedIds.add(manualId);

  const { ids: ocrIds, rawText } = extractMedicineNamesFromOcr(ocrText);
  ocrIds.forEach((id) => detectedIds.add(id));

  const allIds = [...detectedIds];
  const profiles = allIds.map(buildMedicineProfile).filter(Boolean);

  const primary = profiles[0] || null;

  return {
    success: allIds.length > 0,
    ocrText: rawText,
    detectedMedicineIds: allIds,
    detectedNames: profiles.map((p) => p.name),
    primary,
    matches: profiles,
    message: profiles.length
      ? `Identified ${profiles.length} medicine(s) from scan/search.`
      : "Could not match medicine. Try manual search or a clearer photo of the strip label.",
    disclaimer:
      "Educational information only. Verify packaging and consult a pharmacist or doctor before use.",
    scannedAt: new Date().toISOString(),
  };
}

module.exports = {
  processMedicineScan,
  searchMedicineDatabase,
  buildMedicineProfile,
  resolveMedicineId,
  extractMedicineNamesFromOcr,
};
