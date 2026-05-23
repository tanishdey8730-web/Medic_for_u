# MediAI — Intelligent Health Assistant

AI-powered symptom analysis with **prescriptions**, **medicine images**, **Wikipedia web research**, and **emergency detection**.

## Features

- Symptom analysis via chat or quick symptom chips
- Disease probability ranking with treatment plans
- **Prescription generation** with medicine names, dosages, and images
- **Internet research** (Wikipedia summaries for matched conditions)
- **Emergency alerts** for critical symptoms (chest pain, stroke signs, etc.)
- Prescription history tab with download
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

## Disclaimer

This app provides **educational AI guidance only**. It is not a substitute for licensed medical care. Always consult a doctor before taking medication. Call **112** or **108** in emergencies.
