# MediAI — Intelligent Health Assistant

AI-powered symptom analysis with **prescriptions**, **medicine images**, **Wikipedia web research**, and **emergency detection**.

## Features

- Symptom analysis via chat or quick symptom chips
- Disease probability ranking with treatment plans
- **Prescription generation** with medicine names, dosages, and images
- **Internet research** (Wikipedia summaries for matched conditions)
- **Emergency alerts** for critical symptoms (chest pain, stroke signs, etc.)
- Prescription history tab with download
- **Personal Health Dashboard** — health score, trends, medical history, timeline, risk levels
- **AI Health Risk Prediction** — diabetes, heart, hypertension, obesity risk with charts & prevention tips
- **Medicine Interaction Checker** — multi-drug interactions, side effects, contraindications, allergy warnings, alternatives
- **Medicine Scanner** — camera/upload OCR, medicine identification, uses, dosage, warnings, alternatives
- **AI Diet Planner** — weight, diabetes, BP, cholesterol goals; daily/weekly meals, calories & macros
- **Fitness & Health Tracker** — steps, water, sleep, calories, weight; daily/weekly/monthly reports, streaks & milestones
- **Voice AI Doctor** — speak in English/Hindi/Bengali; follow-up questions, TTS replies, chat history
- **AI Lab Report Analyzer** — upload PDF/images; CBC, Blood Sugar, Lipid Profile, LFT, Thyroid, KFT
- Appointments and nearby hospitals (Kolkata demo data)

## Run

```bash
npm install
npm start
```

Open **http://localhost:3001** in your browser (default port; set `PORT` env to change).

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Server status |
| `/api/analyze` | POST | `{ "text": "...", "symptoms": [] }` — full analysis |
| `/api/prescriptions` | GET | Recent prescriptions from session |
| `/api/reports/analyze` | POST | `{ "text", "reportType", "fileName", "imageDataUrl" }` — lab report AI |
| `/api/reports/types` | GET | Supported report types |
| `/api/voice-consultation` | POST | `{ "sessionId", "message", "language": "en\|hi\|bn", "action": "start\|message" }` |
| `/api/dashboard` | POST | Body: prescriptions, appointments, labReports, vitals — returns dashboard payload |
| `/api/risk-analysis` | POST | Age, gender, vitals, lifestyle — returns risk %, categories, tips, trends |
| `/api/drug-interaction` | POST | `{ "medicines": ["ibuprofen","aspirin"], "allergies": ["penicillin"] }` — interaction analysis |
| `/api/drug-interaction/search` | GET | `?q=ibu` — medicine search autocomplete |
| `/api/medicine-scan` | POST | `{ "ocrText", "medicineName", "medicineId" }` — scan/OCR medicine lookup |
| `/api/medicine-scan/search` | GET | `?q=crocin` — medicine database search |
| `/api/diet-plan` | POST | Goal, vitals, diet type, allergies, preferences — meal plans & nutrition |
| `/api/fitness/log` | POST | `{ logs, entry, goals }` — log day & return dashboard |
| `/api/fitness/dashboard` | POST | `{ logs, goals }` — daily/weekly/monthly reports & achievements |
| `/api/fitness/goals` | GET | Default fitness goals |

## Disclaimer

This app provides **educational AI guidance only**. It is not a substitute for licensed medical care. Always consult a doctor before taking medication. Call **112** or **108** in emergencies.
