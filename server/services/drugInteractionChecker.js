const {
  DRUG_PROFILES,
  INTERACTIONS,
  ALLERGY_CLASS_MAP,
  SEARCH_ALIASES,
  pairKey,
} = require("../data/drugInteractionData");

const SEVERITY_ORDER = { none: 0, minor: 1, moderate: 2, major: 3, contraindicated: 4 };

function normalizeDrugName(input) {
  if (!input || typeof input !== "string") return null;
  const q = input.trim().toLowerCase().replace(/[^a-z0-9\s-]/g, "");
  if (!q) return null;

  for (const [id, aliases] of Object.entries(SEARCH_ALIASES)) {
    if (aliases.some((a) => q === a || q.includes(a) || a.includes(q))) return id;
    if (q === id) return id;
  }
  for (const id of Object.keys(DRUG_PROFILES)) {
    const profile = DRUG_PROFILES[id];
    if (q === id || profile.name.toLowerCase().includes(q) || q.includes(id)) return id;
  }
  return null;
}

function searchMedicines(query, limit = 12) {
  const q = (query || "").trim().toLowerCase();
  if (!q) {
    return Object.values(DRUG_PROFILES).map((p) => ({
      id: p.id,
      name: p.name,
      class: p.class,
    }));
  }

  const seen = new Set();
  const results = [];

  for (const [id, aliases] of Object.entries(SEARCH_ALIASES)) {
    const profile = DRUG_PROFILES[id];
    if (!profile) continue;
    const match =
      aliases.some((a) => a.includes(q) || q.includes(a)) ||
      profile.name.toLowerCase().includes(q) ||
      id.includes(q);
    if (match && !seen.has(id)) {
      seen.add(id);
      results.push({ id, name: profile.name, class: profile.class });
    }
  }

  return results.slice(0, limit);
}

function resolveMedicineIds(medicines) {
  const ids = [];
  const unknown = [];
  for (const raw of medicines || []) {
    const id = typeof raw === "string" ? normalizeDrugName(raw) : raw?.id || normalizeDrugName(raw?.name);
    if (id && DRUG_PROFILES[id]) {
      if (!ids.includes(id)) ids.push(id);
    } else if (raw) {
      unknown.push(typeof raw === "string" ? raw : raw.name || String(raw));
    }
  }
  return { ids, unknown };
}

function findPairInteractions(ids) {
  const found = [];
  const idSet = new Set(ids);
  const seenPairs = new Set();

  for (const row of INTERACTIONS) {
    const [a, b] = row.drugs;
    const key = pairKey(a, b);
    if (seenPairs.has(key)) continue;
    if (idSet.has(a) && idSet.has(b)) {
      seenPairs.add(key);
      found.push({
        drugs: [DRUG_PROFILES[a].name, DRUG_PROFILES[b].name],
        drugIds: [a, b],
        severity: row.severity,
        message: row.message,
      });
    }
  }
  return found;
}

function checkAllergies(ids, allergies = []) {
  const warnings = [];
  const allergyList = (allergies || [])
    .map((a) => String(a).trim().toLowerCase())
    .filter(Boolean);

  for (const allergy of allergyList) {
    const affectedIds = ALLERGY_CLASS_MAP[allergy] || [];
    for (const drugId of ids) {
      const profile = DRUG_PROFILES[drugId];
      if (!profile) continue;
      const tagHit =
        profile.allergyTags.some((t) => t === allergy || allergy.includes(t) || t.includes(allergy));
      const classHit = affectedIds.includes(drugId);
      if (tagHit || classHit) {
        warnings.push({
          allergy,
          drug: profile.name,
          drugId,
          severity: "contraindicated",
          message: `Allergy to "${allergy}" may contraindicate ${profile.name}. Do not take without physician clearance.`,
        });
      }
    }
  }
  return warnings;
}

function aggregateSideEffects(ids) {
  const map = new Map();
  for (const id of ids) {
    const p = DRUG_PROFILES[id];
    if (!p) continue;
    map.set(p.name, { drugId: id, drug: p.name, sideEffects: p.sideEffects || [] });
  }
  return [...map.values()];
}

function aggregateContraindications(ids) {
  return ids
    .map((id) => {
      const p = DRUG_PROFILES[id];
      if (!p) return null;
      return { drug: p.name, drugId: id, contraindications: p.contraindications || [] };
    })
    .filter(Boolean);
}

function suggestAlternatives(ids, interactions, allergyWarnings) {
  const blocked = new Set();
  for (const w of allergyWarnings) blocked.add(w.drugId);
  for (const i of interactions) {
    if (i.severity === "major" || i.severity === "contraindicated") {
      i.drugIds.forEach((d) => blocked.add(d));
    }
  }

  const suggestions = [];
  for (const id of ids) {
    const profile = DRUG_PROFILES[id];
    if (!profile) continue;
    const alts = (profile.alternatives || [])
      .filter((altId) => DRUG_PROFILES[altId] && !ids.includes(altId) && !blocked.has(altId))
      .map((altId) => ({
        insteadOf: profile.name,
        alternative: DRUG_PROFILES[altId].name,
        alternativeId: altId,
        note: "Discuss with pharmacist or doctor before switching.",
      }));
    if (alts.length) suggestions.push(...alts);
  }
  const seen = new Set();
  return suggestions.filter((s) => {
    const k = `${s.insteadOf}|${s.alternative}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function computeRiskLevel(interactions, allergyWarnings) {
  let max = SEVERITY_ORDER.none;
  const bump = (sev) => {
    const v = SEVERITY_ORDER[sev] ?? 0;
    if (v > max) max = v;
  };

  interactions.forEach((i) => bump(i.severity));
  allergyWarnings.forEach((w) => bump(w.severity));

  if (max >= SEVERITY_ORDER.contraindicated) {
    return { level: "critical", label: "Critical", color: "#ef4444" };
  }
  if (max >= SEVERITY_ORDER.major) {
    return { level: "high", label: "High", color: "#f97316" };
  }
  if (max >= SEVERITY_ORDER.moderate) {
    return { level: "moderate", label: "Moderate", color: "#eab308" };
  }
  if (max >= SEVERITY_ORDER.minor) {
    return { level: "low", label: "Low", color: "#22c55e" };
  }
  return { level: "minimal", label: "Minimal", color: "#10b981" };
}

function overallInteractionSeverity(interactions, allergyWarnings) {
  let max = "none";
  const rank = (a, b) => (SEVERITY_ORDER[a] >= SEVERITY_ORDER[b] ? a : b);
  for (const i of interactions) max = rank(max, i.severity);
  for (const w of allergyWarnings) max = rank(max, w.severity);
  return max;
}

function analyzeDrugInteraction({ medicines = [], allergies = [] } = {}) {
  const { ids, unknown } = resolveMedicineIds(medicines);

  if (ids.length === 0) {
    return {
      ok: false,
      error: "No recognized medicines. Try generic names like paracetamol, ibuprofen, amoxicillin.",
      unknown,
    };
  }

  const interactions = findPairInteractions(ids);
  const allergyWarnings = checkAllergies(ids, allergies);
  const sideEffects = aggregateSideEffects(ids);
  const contraindications = aggregateContraindications(ids);
  const alternativeMedicines = suggestAlternatives(ids, interactions, allergyWarnings);
  const interactionSeverity = overallInteractionSeverity(interactions, allergyWarnings);
  const riskLevel = computeRiskLevel(interactions, allergyWarnings);

  const medicinesAnalyzed = ids.map((id) => {
    const p = DRUG_PROFILES[id];
    return { id, name: p.name, class: p.class };
  });

  return {
    ok: true,
    medicinesAnalyzed,
    unknown,
    drugInteractions: interactions,
    sideEffects,
    contraindications,
    allergyWarnings,
    interactionSeverity,
    riskLevel,
    alternativeMedicines,
    summary:
      interactions.length || allergyWarnings.length
        ? `Found ${interactions.length} interaction(s) and ${allergyWarnings.length} allergy warning(s). Overall severity: ${interactionSeverity}.`
        : `No major interactions detected among ${ids.length} medicine(s). This is educational only — confirm with a pharmacist.`,
    disclaimer:
      "Educational tool only. Not a substitute for professional medical advice, diagnosis, or treatment.",
    checkedAt: new Date().toISOString(),
  };
}

module.exports = {
  analyzeDrugInteraction,
  searchMedicines,
  normalizeDrugName,
  DRUG_PROFILES,
};
