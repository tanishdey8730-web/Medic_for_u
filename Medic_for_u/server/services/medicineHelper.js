const { MEDICINES } = require("../data/medicalKnowledge");
const { findMedicinesInText, medicinesToPayload } = require("./prescriptionParser");

const MIN_MEDICINE_OPTIONS = 5;

const SYMPTOM_MED_MAP = {
  fever: [
    "paracetamol",
    "ibuprofen",
    "naproxen",
    "aspirin",
    "ors",
    "cetirizine",
    "diphenhydramine",
    "ascorbic_acid",
  ],
  headache: ["paracetamol", "ibuprofen", "naproxen", "aspirin", "diclofenac"],
  "body aches": ["paracetamol", "ibuprofen", "naproxen", "diclofenac", "aspirin"],
  cough: [
    "dextromethorphan",
    "cetirizine",
    "loratadine",
    "paracetamol",
    "salbutamol",
    "ascorbic_acid",
  ],
  fatigue: ["paracetamol", "ors", "ascorbic_acid", "ibuprofen"],
  nausea: ["ors", "omeprazole", "paracetamol", "metformin"],
  "chest pain": ["aspirin"],
  "shortness of breath": ["salbutamol", "paracetamol"],
  "sore throat": [
    "paracetamol",
    "ibuprofen",
    "cetirizine",
    "loratadine",
    "amoxicillin",
    "azithromycin",
  ],
  dizziness: ["ors", "paracetamol"],
  rash: ["cetirizine", "loratadine", "diphenhydramine", "paracetamol"],
  vomiting: ["ors", "omeprazole", "paracetamol"],
  diarrhea: ["ors", "omeprazole", "paracetamol"],
  wheezing: ["salbutamol", "cetirizine"],
  sneezing: ["cetirizine", "loratadine", "diphenhydramine"],
};

function userWantsMedicines(text) {
  const lower = text.toLowerCase();
  return (
    /\b(medicine|medicines|medication|medications|meds|drug|drugs|tablet|tablets|pill|pills|capsule|otc|prescri)\b/i.test(
      lower,
    ) ||
    /\b(what|which|suggest|recommend|give|need|best)\b.*\b(medicine|medication|drug|tablet|pill|take)\b/i.test(
      lower,
    ) ||
    /\b(medicine|medication|drug|tablet)\b.*\b(for|to treat)\b/i.test(lower) ||
    findMedicinesInText(lower).length > 0
  );
}

/** Pull condition words from prompts like "medicine for fever" */
function extractTopicsFromMedicineQuestion(text) {
  const lower = text.toLowerCase();
  const topics = [];

  const forMatch = lower.match(
    /(?:medicine|medication|meds|drug|tablet|pill|treatment|take)\s+(?:for|against|to treat)\s+([a-z\s]{2,40})/i,
  );
  const phrase = forMatch ? forMatch[1].trim() : lower;

  for (const key of Object.keys(SYMPTOM_MED_MAP)) {
    if (phrase.includes(key) || lower.includes(key)) topics.push(key);
  }

  if (/fever|pyrexia|temperature|hot/i.test(lower)) topics.push("fever");
  if (/headache|migraine/i.test(lower)) topics.push("headache");
  if (/cough|cold/i.test(lower)) topics.push("cough");
  if (/pain|ache/i.test(lower)) topics.push("body aches");
  if (/throat/i.test(lower)) topics.push("sore throat");
  if (/allerg|itch|rash|sneez/i.test(lower)) topics.push("rash");
  if (/stomach|gastric|acid|nausea|vomit/i.test(lower)) topics.push("nausea");
  if (/breath|wheez/i.test(lower)) topics.push("shortness of breath");

  return [...new Set(topics)];
}

function getMedicinePurpose(key, topic) {
  const purposes = {
    paracetamol: "Reduces fever and relieves mild to moderate pain",
    ibuprofen: "Lowers fever and reduces inflammation",
    cetirizine: "Relieves allergy and cold symptoms",
    loratadine: "Non-drowsy allergy relief",
    ors: "Prevents dehydration",
    omeprazole: "Reduces stomach acid",
    salbutamol: "Opens airways for easier breathing",
    amoxicillin: "Treats bacterial infections (Rx only)",
    azithromycin: "Alternative antibiotic (Rx only)",
    aspirin: "Pain and fever relief (avoid in children with viral fever)",
    naproxen: "Longer-lasting fever and pain relief",
    diclofenac: "Strong anti-inflammatory for pain",
    diphenhydramine: "Helps rest during fever/cold (sedating)",
    dextromethorphan: "Suppresses dry cough",
    ascorbic_acid: "Immune support during recovery",
  };
  return purposes[key] || `Commonly used for ${topic || "your symptom"}`;
}

function expandToMinimum(keys, topics, min = MIN_MEDICINE_OPTIONS) {
  for (const topic of topics) {
    const list = SYMPTOM_MED_MAP[topic] || [];
    for (const k of list) {
      keys.add(k);
      if (keys.size >= min) return keys;
    }
  }
  if (keys.size < min) {
    ["paracetamol", "ibuprofen", "naproxen", "ors", "cetirizine", "aspirin"].forEach((k) =>
      keys.add(k),
    );
  }
  return keys;
}

function getMedicinesForQuery(text, symptoms, scoredConditions, options = {}) {
  const { textOnly = false } = options;
  const keys = new Set(findMedicinesInText(text));
  const topics = extractTopicsFromMedicineQuestion(text);

  const symptomSource = textOnly ? topics : symptoms;
  for (const sym of symptomSource) {
    const meds = SYMPTOM_MED_MAP[sym];
    if (meds) meds.forEach((k) => keys.add(k));
  }

  if (!textOnly) {
    for (const cond of (scoredConditions || []).slice(0, 2)) {
      (cond.medicineKeys || []).forEach((k) => keys.add(k));
    }
  }

  if (!keys.size && userWantsMedicines(text)) {
    keys.add("paracetamol");
    if (/cough|cold|throat/i.test(text)) keys.add("cetirizine");
    if (/stomach|acid|gastric|nausea/i.test(text)) keys.add("omeprazole");
    if (/allerg|itch|rash/i.test(text)) keys.add("loratadine");
    if (/pain|inflamm|ache/i.test(text)) keys.add("ibuprofen");
  }

  if (userWantsMedicines(text) || options.textOnly) {
    expandToMinimum(keys, topics.length ? topics : symptomSource, MIN_MEDICINE_OPTIONS);
  }

  const mainTopic = topics[0] || symptomSource[0] || "symptoms";
  const list = [...keys].slice(0, 8);
  return medicinesToPayload(list).map((m) => ({
    ...m,
    purpose: getMedicinePurpose(m.id, mainTopic),
  }));
}

module.exports = {
  userWantsMedicines,
  getMedicinesForQuery,
  extractTopicsFromMedicineQuestion,
  SYMPTOM_MED_MAP,
  MIN_MEDICINE_OPTIONS,
};
