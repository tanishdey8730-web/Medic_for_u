const { MEDICINES, getMedicineImage, medicineImagePath } = require("../data/medicalKnowledge");

const MEDICINE_ALIASES = {
  paracetamol: [
    "paracetamol", "acetaminophen", "panadol", "crocin", "dolo", "calpol", "tylenol",
  ],
  ibuprofen: ["ibuprofen", "brufen", "advil", "nurofen"],
  aspirin: ["aspirin", "ecosprin", "disprin"],
  amoxicillin: ["amoxicillin", "mox", "amoxyclav"],
  azithromycin: ["azithromycin", "zithromax", "azithral", "z pack"],
  cetirizine: ["cetirizine", "zyrtec", "cetrizine", "alerid"],
  omeprazole: ["omeprazole", "omez", "prilosec"],
  ors: ["ors", "oral rehydration", "electral", "rehydration"],
  salbutamol: ["salbutamol", "albuterol", "ventolin", "asthalin"],
  metformin: ["metformin", "glycomet"],
  loratadine: ["loratadine", "claritin"],
  naproxen: ["naproxen", "naprosyn", "aleve"],
  diclofenac: ["diclofenac", "voltaren", "voveran"],
  diphenhydramine: ["diphenhydramine", "benadryl"],
  dextromethorphan: ["dextromethorphan", "cough syrup", "benylin"],
  ascorbic_acid: ["vitamin c", "ascorbic", "limcee"],
};

function findMedicinesInText(text) {
  const lower = text.toLowerCase();
  const found = [];

  for (const [key, aliases] of Object.entries(MEDICINE_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(alias)) {
        found.push(key);
        break;
      }
    }
  }

  return [...new Set(found)];
}

function extractMeta(text) {
  const doctor =
    text.match(/(?:Dr\.?|Doctor)\s+([A-Za-z][A-Za-z\s.]{2,30})/i)?.[1]?.trim() || null;
  const date =
    text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/)?.[1] ||
    text.match(/(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})/i)?.[1] ||
    null;
  const patient =
    text.match(/(?:Patient|Name)\s*[:\-]\s*([A-Za-z\s]{2,40})/i)?.[1]?.trim() || null;

  return { doctor, date, patient };
}

function medicinesToPayload(keys) {
  const RX_KEYS = ["amoxicillin", "azithromycin", "salbutamol", "metformin"];

  return keys.map((key) => {
    const m = MEDICINES[key];
    if (!m) return null;
    return {
      id: key,
      name: m.name,
      generic: m.generic,
      type: m.type,
      image: getMedicineImage(key),
      imageFallback: medicineImagePath(key),
      dosage: m.typicalDose,
      purpose: `Listed on uploaded prescription`,
      caution: m.caution,
      rxRequired: RX_KEYS.includes(key),
      fromUpload: true,
    };
  }).filter(Boolean);
}

function parsePrescriptionText(text) {
  const trimmed = (text || "").trim();
  if (!trimmed) {
    return { medicines: [], meta: {}, rawText: "" };
  }

  const medKeys = findMedicinesInText(trimmed);
  const meta = extractMeta(trimmed);

  return {
    medicines: medicinesToPayload(medKeys),
    medKeys,
    meta,
    rawText: trimmed.slice(0, 5000),
  };
}

module.exports = {
  findMedicinesInText,
  parsePrescriptionText,
  medicinesToPayload,
  MEDICINE_ALIASES,
};
