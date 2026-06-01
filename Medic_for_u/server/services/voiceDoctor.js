const { analyzeSymptoms } = require("./medicalEngine");
const { detectEmergency } = require("./emergencyDetector");

const sessions = new Map();

const LANG = {
  en: {
    greeting:
      "Hello, I'm Dr. MediAI, your voice health assistant. Tell me what symptoms you're experiencing, and I'll guide you step by step.",
    askDuration: "How long have you had these symptoms?",
    askSeverity: "On a scale of 1 to 10, how severe is your discomfort?",
    askFever: "Do you have fever or chills right now?",
    askMore: "Is there anything else — cough, pain, nausea, or breathlessness?",
    analyzing: "Thank you. Let me analyze what you've shared.",
    emergency:
      "Your symptoms may need urgent care. Please call emergency services or visit the nearest hospital immediately.",
    disclaimer: "This is AI guidance only, not a licensed diagnosis. Please see a doctor for confirmation.",
    goodbye: "Take care. Rest well and follow up with a doctor if symptoms worsen. You can start a new consultation anytime.",
  },
  hi: {
    greeting:
      "नमस्ते, मैं Dr. MediAI हूँ। अपने लक्षण बताइए, मैं आपकी मदद करूँगा।",
    askDuration: "ये लक्षण कब से हैं?",
    askSeverity: "1 से 10 में, आपकी तकलीफ कितनी है?",
    askFever: "क्या अभी बुखार या ठंड लग रही है?",
    askMore: "क्या खाँसी, दर्द, उल्टी या साँस की तकलीफ भी है?",
    analyzing: "धन्यवाद। मैं आपकी जानकारी का विश्लेषण कर रहा हूँ।",
    emergency:
      "आपके लक्षण गंभीर हो सकते हैं। तुरंत अस्पताल जाएँ या आपातकालीन नंबर पर कॉल करें।",
    disclaimer: "यह AI सलाह है, डॉक्टर की जाँच ज़रूरी है।",
    goodbye: "ध्यान रखें। लक्षण बढ़ें तो डॉक्टर से मिलें।",
  },
  bn: {
    greeting:
      "নমস্কার, আমি Dr. MediAI। আপনার লক্ষণগুলো বলুন, আমি ধাপে ধাপে সাহায্য করব।",
    askDuration: "কতদিন ধরে এই লক্ষণ?",
    askSeverity: "১ থেকে ১০ এর মধ্যে কতটা অস্বস্তি?",
    askFever: "এখন জ্বর বা ঠান্ডা লাগছে?",
    askMore: "কাশি, ব্যথা, বমি বা শ্বাসকষ্ট আছে?",
    analyzing: "ধন্যবাদ। আমি বিশ্লেষণ করছি।",
    emergency:
      "লক্ষণগুলো গুরুতর হতে পারে। দয়া করে জরুরি নম্বরে কল করুন বা হাসপাতালে যান।",
    disclaimer: "এটি AI পরামর্শ, ডাক্তারের পরামর্শ অপরিহার্য।",
    goodbye: "সাবধানে থাকুন। লক্ষণ বাড়লে ডাক্তার দেখান।",
  },
};

const FOLLOWUP_STEPS = ["duration", "severity", "fever", "more"];

function t(lang, key) {
  return LANG[lang]?.[key] || LANG.en[key];
}

function extractSymptomsFromText(text) {
  const lower = text.toLowerCase();
  const list = [
    "fever", "headache", "cough", "fatigue", "nausea", "chest pain",
    "shortness of breath", "sore throat", "body aches", "dizziness",
    "vomiting", "diarrhea", "rash",
  ];
  const hi = {
    बुखार: "fever", सिरदर्द: "headache", खांसी: "cough", उल्टी: "nausea",
    दर्द: "pain", चक्कर: "dizziness",
  };
  const bn = {
    জ্বর: "fever", মাথাব্যথা: "headache", কাশি: "cough", বমি: "nausea",
    ব্যথা: "pain", মাথা ঘোরা: "dizziness",
  };
  const found = list.filter((s) => lower.includes(s));
  for (const [k, v] of Object.entries({ ...hi, ...bn })) {
    if (text.includes(k) && !found.includes(v)) found.push(v);
  }
  if (/fever|बुखार|জ্বর|temperature/i.test(text) && !found.includes("fever")) found.push("fever");
  if (/cough|खांसी|কাশি/i.test(text) && !found.includes("cough")) found.push("cough");
  return [...new Set(found)];
}

function getSession(sessionId, language = "en") {
  if (!sessionId || !sessions.has(sessionId)) {
    const id = `VC-${Date.now().toString(36).toUpperCase()}`;
    const session = {
      id,
      language: LANG[language] ? language : "en",
      phase: "greeting",
      stepIndex: 0,
      symptoms: [],
      messages: [],
      duration: null,
      severity: null,
      hasFever: null,
      createdAt: new Date().toISOString(),
    };
    sessions.set(id, session);
    return session;
  }
  const s = sessions.get(sessionId);
  if (LANG[language]) s.language = language;
  return s;
}

function addMessage(session, role, text) {
  session.messages.push({
    role,
    text,
    at: new Date().toISOString(),
  });
  if (session.messages.length > 40) session.messages = session.messages.slice(-40);
}

function nextFollowUp(session) {
  while (session.stepIndex < FOLLOWUP_STEPS.length) {
    const step = FOLLOWUP_STEPS[session.stepIndex];
    session.stepIndex++;
    if (step === "duration" && !session.duration) return t(session.language, "askDuration");
    if (step === "severity" && session.severity == null) return t(session.language, "askSeverity");
    if (step === "fever" && session.hasFever == null) return t(session.language, "askFever");
    if (step === "more") return t(session.language, "askMore");
  }
  return null;
}

function parseFollowUpAnswer(session, message) {
  const step = FOLLOWUP_STEPS[session.stepIndex - 1];
  const lower = message.toLowerCase();
  if (step === "duration") {
    session.duration = message.slice(0, 80);
  } else if (step === "severity") {
    const n = message.match(/\d+/);
    session.severity = n ? Math.min(10, parseInt(n[0], 10)) : message;
  } else if (step === "fever") {
    session.hasFever = /yes|हाँ|हां|হ্যাঁ|haan|jee|जी|আছে|true|fever|बुखार|জ্বর/i.test(message);
  }
  session.symptoms = [...new Set([...session.symptoms, ...extractSymptomsFromText(message)])];
}

async function buildAdvice(session) {
  const combined = [
    session.symptoms.join(", "),
    session.duration ? `duration: ${session.duration}` : "",
    session.severity != null ? `severity: ${session.severity}` : "",
    session.hasFever ? "has fever" : "",
  ]
    .filter(Boolean)
    .join(". ");

  const analysis = await analyzeSymptoms({
    text: combined || "general unwell",
    selectedSymptoms: session.symptoms,
    textOnly: true,
  });

  const emerg = detectEmergency(combined, []);
  let reply = "";

  if (emerg.isEmergency) {
    reply = t(session.language, "emergency") + " ";
  }

  if (session.language === "hi") {
    reply += `मेरा विश्लेषण: ${analysis.primaryCondition?.name || "सामान्य लक्षण"}। `;
    reply += (analysis.recommendations || []).slice(0, 4).join(" ") + " ";
    reply += t(session.language, "disclaimer");
  } else if (session.language === "bn") {
    reply += `আমার বিশ্লেষণ: ${analysis.primaryCondition?.name || "সাধারণ লক্ষণ"}। `;
    reply += (analysis.recommendations || []).slice(0, 4).join(" ") + " ";
    reply += t(session.language, "disclaimer");
  } else {
    reply += `Based on your symptoms, the likely concern is ${analysis.primaryCondition?.name || "a general symptom pattern"}. `;
    reply += (analysis.recommendations || []).slice(0, 4).join(" ") + " ";
    reply += t(session.language, "disclaimer");
  }

  return {
    reply,
    analysis,
    emergency: emerg,
  };
}

async function processVoiceConsultation({
  sessionId = null,
  message = "",
  language = "en",
  action = "message",
}) {
  const lang = LANG[language] ? language : "en";
  const session = getSession(sessionId, lang);

  if (action === "start" || (!message.trim() && session.phase === "greeting")) {
    const greeting = t(lang, "greeting");
    addMessage(session, "assistant", greeting);
    session.phase = "gathering";
    return formatResponse(session, greeting, { phase: "gathering" });
  }

  if (!message.trim()) {
    return formatResponse(session, t(lang, "askMore"), { phase: session.phase });
  }

  addMessage(session, "user", message);
  session.symptoms = [...new Set([...session.symptoms, ...extractSymptomsFromText(message)])];

  const emerg = detectEmergency(message, []);
  if (emerg.isEmergency) {
    const reply = t(lang, "emergency");
    addMessage(session, "assistant", reply);
    session.phase = "complete";
    return formatResponse(session, reply, {
      phase: "complete",
      emergency: emerg,
    });
  }

  if (session.phase === "gathering") {
    if (session.symptoms.length < 1) {
      const reply =
        lang === "hi"
          ? "कृपया अपना मुख्य लक्षण बताएं, जैसे बुखार, सिरदर्द या खाँसी।"
          : lang === "bn"
            ? "অনুগ্রহ করে মূল লক্ষণ বলুন — জ্বর, মাথাব্যথা বা কাশি।"
            : "Please describe your main symptom, such as fever, headache, or cough.";
      addMessage(session, "assistant", reply);
      return formatResponse(session, reply, { phase: "gathering" });
    }
    session.phase = "followup";
    session.stepIndex = 0;
    const question = nextFollowUp(session);
    if (question) {
      addMessage(session, "assistant", question);
      return formatResponse(session, question, { phase: "followup", followUpQuestion: question });
    }
  }

  if (session.phase === "followup") {
    parseFollowUpAnswer(session, message);
    const question = nextFollowUp(session);
    if (question) {
      addMessage(session, "assistant", question);
      session.phase = "followup";
      return formatResponse(session, question, {
        phase: "followup",
        followUpQuestion: question,
      });
    }

    session.phase = "analyzing";
    const analyzingNote = t(lang, "analyzing");
    addMessage(session, "assistant", analyzingNote);

    const { reply, analysis, emergency } = await buildAdvice(session);
    addMessage(session, "assistant", reply);
    session.phase = "complete";

    return formatResponse(session, reply, {
      phase: "complete",
      consultation: {
        symptoms: session.symptoms,
        duration: session.duration,
        severity: session.severity,
        primaryCondition: analysis.primaryCondition,
        recommendations: analysis.recommendations,
        diseases: analysis.diseases,
      },
      emergency,
    });
  }

  if (session.phase === "complete") {
    const reply = t(lang, "goodbye");
    addMessage(session, "assistant", reply);
    return formatResponse(session, reply, { phase: "complete" });
  }

  const fallback = t(lang, "askMore");
  addMessage(session, "assistant", fallback);
  return formatResponse(session, fallback, { phase: session.phase });
}

function formatResponse(session, reply, extra = {}) {
  return {
    success: true,
    sessionId: session.id,
    reply,
    language: session.language,
    messages: session.messages,
    symptoms: session.symptoms,
    ...extra,
  };
}

function getSessionHistory(sessionId) {
  const s = sessions.get(sessionId);
  if (!s) return null;
  return formatResponse(s, s.messages[s.messages.length - 1]?.text || "", { phase: s.phase });
}

module.exports = {
  processVoiceConsultation,
  getSessionHistory,
  sessions,
};
