const { REPORT_TYPES } = require("../data/labReferenceRanges");

function normalizeText(text) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[|:]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function detectReportType(text) {
  const lower = normalizeText(text);
  let bestType = "cbc";
  let bestScore = 0;

  for (const [id, profile] of Object.entries(REPORT_TYPES)) {
    let score = 0;
    for (const alias of profile.aliases) {
      if (lower.includes(alias)) score += 2;
    }
    for (const marker of Object.values(profile.markers)) {
      for (const name of marker.names) {
        if (lower.includes(name)) score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = id;
    }
  }
  return bestType;
}

function parseNumericValue(str) {
  const m = String(str).match(/(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : null;
}

function extractValueForMarker(text, markerDef) {
  const lines = text.split(/\n/);
  const full = normalizeText(text);

  for (const name of markerDef.names) {
    const patterns = [
      new RegExp(`${name.replace(/\s+/g, "[\\s.]*")}[\\s:]*([\\d.]+)\\s*([a-z%/µμ]+)?`, "i"),
      new RegExp(`([\\d.]+)\\s*([a-z%/µμ]+)?\\s*${name.replace(/\s+/g, "[\\s.]*")}`, "i"),
    ];

    for (const pattern of patterns) {
      const m = full.match(pattern);
      if (m) {
        const value = parseFloat(m[1]);
        if (!Number.isNaN(value)) {
          return { value, unit: (m[2] || markerDef.unit || "").trim() || markerDef.unit };
        }
      }
    }

    for (const line of lines) {
      if (!line.toLowerCase().includes(name)) continue;
      const nums = line.match(/(\d+\.?\d*)/g);
      if (nums && nums.length) {
        const value = parseFloat(nums[nums.length - 1]);
        if (!Number.isNaN(value)) return { value, unit: markerDef.unit };
      }
    }
  }
  return null;
}

function parseAllMarkers(text, reportTypeId) {
  const profile = REPORT_TYPES[reportTypeId] || REPORT_TYPES.cbc;
  const results = [];

  for (const [key, def] of Object.entries(profile.markers)) {
    const extracted = extractValueForMarker(text, def);
    if (extracted) {
      results.push({
        id: key,
        name: def.names[0].replace(/\b\w/g, (c) => c.toUpperCase()),
        value: extracted.value,
        unit: extracted.unit || def.unit,
        refMin: def.min,
        refMax: def.max,
      });
    }
  }

  return { profile, markers: results };
}

function extractPatientMeta(text) {
  const meta = {};
  const nameMatch = text.match(/(?:patient|name)\s*[:\-]\s*([A-Za-z\s]{2,40})/i);
  const ageMatch = text.match(/age\s*[:\-]?\s*(\d{1,3})\s*(?:years|yrs|y)?/i);
  const dateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
  if (nameMatch) meta.patient = nameMatch[1].trim();
  if (ageMatch) meta.age = parseInt(ageMatch[1], 10);
  if (dateMatch) meta.reportDate = dateMatch[1];
  return meta;
}

module.exports = {
  normalizeText,
  detectReportType,
  parseAllMarkers,
  extractPatientMeta,
  parseNumericValue,
};
