/** Uses / indications for medicine scanner display */
const MEDICINE_USES = {
  paracetamol: ["Fever", "Mild to moderate pain", "Headache", "Body aches"],
  ibuprofen: ["Pain", "Inflammation", "Fever", "Menstrual cramps"],
  aspirin: ["Pain", "Fever", "Low-dose: heart attack prevention (prescribed)"],
  amoxicillin: ["Bacterial infections", "Respiratory infections", "UTI (as prescribed)"],
  azithromycin: ["Respiratory infections", "Skin infections", "STI (as prescribed)"],
  cetirizine: ["Allergies", "Hay fever", "Hives", "Itching"],
  omeprazole: ["Acid reflux", "GERD", "Stomach ulcer protection"],
  ors: ["Dehydration", "Diarrhea", "Heat exhaustion recovery"],
  salbutamol: ["Asthma", "Wheezing", "Bronchospasm relief"],
  metformin: ["Type 2 diabetes blood sugar control"],
  loratadine: ["Allergies", "Sneezing", "Runny nose", "Itchy eyes"],
  naproxen: ["Pain", "Inflammation", "Arthritis symptoms"],
  diclofenac: ["Joint pain", "Muscle pain", "Inflammation"],
  diphenhydramine: ["Allergies", "Sleep aid", "Motion sickness"],
  dextromethorphan: ["Dry cough suppression"],
  ascorbic_acid: ["Immune support", "Vitamin C deficiency", "Recovery aid"],
};

const SCANNER_PROFILE_FALLBACK = {
  ascorbic_acid: {
    sideEffects: ["Stomach upset (high doses)", "Diarrhea (excess)"],
    contraindications: ["Kidney stones history (high dose caution)"],
    alternatives: ["dietary vitamin C"],
  },
  ors: {
    sideEffects: ["Generally well tolerated"],
    contraindications: ["Severe kidney failure without medical guidance"],
    alternatives: [],
  },
};

module.exports = { MEDICINE_USES, SCANNER_PROFILE_FALLBACK };
