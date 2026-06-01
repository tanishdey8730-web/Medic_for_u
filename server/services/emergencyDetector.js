const { EMERGENCY_KEYWORDS } = require("../data/medicalKnowledge");

function detectEmergency(text, matchedConditions = []) {
  const alerts = [];
  let level = "none";

  for (const rule of EMERGENCY_KEYWORDS) {
    if (rule.pattern.test(text)) {
      alerts.push({ level: rule.level, message: rule.message });
      if (rule.level === "critical") level = "critical";
      else if (level !== "critical" && rule.level === "high") level = "high";
    }
  }

  for (const cond of matchedConditions) {
    if (cond.emergency) {
      alerts.push({
        level: "critical",
        message: `${cond.name} — seek emergency medical care immediately.`,
      });
      level = "critical";
    }
    if (cond.emergencyIf) {
      const lower = text.toLowerCase();
      for (const flag of cond.emergencyIf) {
        if (lower.includes(flag.toLowerCase())) {
          alerts.push({
            level: "critical",
            message: `Warning sign detected: ${flag}. Urgent medical attention needed.`,
          });
          level = "critical";
        }
      }
    }
    if (cond.severity === "critical" && !cond.emergency) {
      if (level !== "critical") level = "high";
    }
  }

  const unique = [];
  const seen = new Set();
  for (const a of alerts) {
    const key = a.message;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(a);
    }
  }

  return {
    isEmergency: level === "critical" || level === "high",
    level,
    alerts: unique,
    emergencyNumbers: ["112", "911", "108 (India ambulance)"],
    action:
      level === "critical"
        ? "Call emergency services NOW. Do not wait for symptoms to worsen."
        : level === "high"
          ? "Seek urgent care within the hour or call emergency if symptoms worsen."
          : null,
  };
}

module.exports = { detectEmergency };
