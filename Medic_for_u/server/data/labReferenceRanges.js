/** Adult reference ranges (general guidance — labs vary by facility) */
const REPORT_TYPES = {
  cbc: {
    id: "cbc",
    label: "Complete Blood Count (CBC)",
    aliases: ["cbc", "complete blood count", "hemogram", "blood count"],
    markers: {
      hemoglobin: { names: ["hemoglobin", "hb", "hgb"], unit: "g/dL", min: 12, max: 16, femaleMax: 15 },
      rbc: { names: ["rbc", "red blood cell", "erythrocyte"], unit: "million/µL", min: 4.2, max: 5.9 },
      wbc: { names: ["wbc", "white blood cell", "leucocyte", "leukocyte"], unit: "/µL", min: 4000, max: 11000 },
      platelets: { names: ["platelet", "plt", "platelet count"], unit: "/µL", min: 150000, max: 400000 },
      hematocrit: { names: ["hematocrit", "hct", "pcv"], unit: "%", min: 36, max: 48 },
      mcv: { names: ["mcv"], unit: "fL", min: 80, max: 100 },
      mch: { names: ["mch"], unit: "pg", min: 27, max: 33 },
      mchc: { names: ["mchc"], unit: "g/dL", min: 32, max: 36 },
      neutrophils: { names: ["neutrophil", "neutrophils", "polymorphs"], unit: "%", min: 40, max: 70 },
      lymphocytes: { names: ["lymphocyte", "lymphocytes"], unit: "%", min: 20, max: 40 },
      eosinophils: { names: ["eosinophil", "eosinophils"], unit: "%", min: 1, max: 6 },
      monocytes: { names: ["monocyte", "monocytes"], unit: "%", min: 2, max: 8 },
    },
  },
  blood_sugar: {
    id: "blood_sugar",
    label: "Blood Sugar / Glucose",
    aliases: ["glucose", "blood sugar", "sugar", "diabetes", "fbs", "ppbs", "hba1c"],
    markers: {
      fasting_glucose: { names: ["fasting", "fbs", "fasting glucose", "fasting blood sugar"], unit: "mg/dL", min: 70, max: 100 },
      random_glucose: { names: ["random glucose", "random blood sugar", "rbs", "blood glucose"], unit: "mg/dL", min: 70, max: 140 },
      post_prandial: { names: ["ppbs", "post prandial", "postprandial", "2 hour", "2hr"], unit: "mg/dL", min: 70, max: 140 },
      hba1c: { names: ["hba1c", "hb a1c", "glycated hemoglobin", "a1c"], unit: "%", min: 4, max: 5.6 },
    },
  },
  lipid_profile: {
    id: "lipid_profile",
    label: "Lipid Profile",
    aliases: ["lipid", "cholesterol", "lipid profile", "lipogram"],
    markers: {
      total_cholesterol: { names: ["total cholesterol", "cholesterol total", "serum cholesterol"], unit: "mg/dL", min: 0, max: 200 },
      ldl: { names: ["ldl", "ldl cholesterol", "low density"], unit: "mg/dL", min: 0, max: 100 },
      hdl: { names: ["hdl", "hdl cholesterol", "high density"], unit: "mg/dL", min: 40, max: 999 },
      triglycerides: { names: ["triglyceride", "triglycerides", "tg"], unit: "mg/dL", min: 0, max: 150 },
      vldl: { names: ["vldl"], unit: "mg/dL", min: 0, max: 30 },
    },
  },
  liver_function: {
    id: "liver_function",
    label: "Liver Function Test (LFT)",
    aliases: ["lft", "liver", "hepatic", "sgot", "sgpt"],
    markers: {
      ast: { names: ["sgot", "ast", "aspartate"], unit: "U/L", min: 0, max: 40 },
      alt: { names: ["sgpt", "alt", "alanine"], unit: "U/L", min: 0, max: 41 },
      bilirubin_total: { names: ["bilirubin total", "total bilirubin", "t. bilirubin"], unit: "mg/dL", min: 0.1, max: 1.2 },
      bilirubin_direct: { names: ["direct bilirubin", "conjugated bilirubin"], unit: "mg/dL", min: 0, max: 0.3 },
      alp: { names: ["alp", "alkaline phosphatase"], unit: "U/L", min: 44, max: 147 },
      albumin: { names: ["albumin", "serum albumin"], unit: "g/dL", min: 3.5, max: 5.5 },
    },
  },
  thyroid: {
    id: "thyroid",
    label: "Thyroid Profile",
    aliases: ["thyroid", "tsh", "t3", "t4"],
    markers: {
      tsh: { names: ["tsh", "thyroid stimulating"], unit: "mIU/L", min: 0.4, max: 4.0 },
      t3: { names: ["t3", "triiodothyronine", "total t3"], unit: "ng/dL", min: 80, max: 200 },
      t4: { names: ["t4", "thyroxine", "total t4"], unit: "µg/dL", min: 5, max: 12 },
      free_t4: { names: ["free t4", "ft4"], unit: "ng/dL", min: 0.8, max: 1.8 },
    },
  },
  kidney_function: {
    id: "kidney_function",
    label: "Kidney Function Test (KFT)",
    aliases: ["kft", "kidney", "renal", "creatinine", "urea"],
    markers: {
      creatinine: { names: ["creatinine", "serum creatinine"], unit: "mg/dL", min: 0.6, max: 1.2 },
      urea: { names: ["urea", "blood urea", "bun"], unit: "mg/dL", min: 15, max: 40 },
      uric_acid: { names: ["uric acid"], unit: "mg/dL", min: 3.5, max: 7.2 },
      egfr: { names: ["egfr", "gfr"], unit: "mL/min", min: 90, max: 999 },
    },
  },
};

module.exports = { REPORT_TYPES };
