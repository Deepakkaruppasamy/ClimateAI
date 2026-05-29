# 🌍 ClimateAI — AI-Powered Climate Intelligence Platform

A futuristic, cinematic AI-powered climate intelligence platform with glassmorphism, neon glows, 3D globe, weather particles, and streaming AI chat.

---

## 🚀 Quick Start (Windows)

### Option 1 — Double-click launcher
```
Double-click: C:\ClimateAI\start.bat
```
This installs all packages and opens both servers automatically.

### Option 2 — Manual (PowerShell / CMD)
```powershell
# Terminal 1 — Frontend
cd C:\ClimateAI\client
npm install
npm run dev
# Opens at http://localhost:3000

# Terminal 2 — Backend (optional)
cd C:\ClimateAI\server
npm install
npm run dev
# Runs at http://localhost:5000
```

---

## ✨ Features

| Page | URL | Description |
|------|-----|-------------|
| Landing | `/` | Hero with 3D globe, weather particles, stats |
| Dashboard | `/dashboard` | Real-time weather, AQI, 7-day forecast, AI insights |
| AI Assistant | `/assistant` | Streaming chat, voice input, Groq AI |
| Analytics | `/analytics` | Historical trends, radar chart, forecast accuracy |
| Alerts | `/alerts` | Disaster alert system with pulsing effects |
| Maps | `/map` | Interactive Leaflet map with weather overlays |
| Admin | `/admin` | System monitoring, live metrics, activity feed |

---

## 🤖 AI Setup (Optional)

Get a **free** Groq API key at [console.groq.com](https://console.groq.com)

Add to `C:\ClimateAI\client\.env`:
```
VITE_GROQ_API_KEY=your_key_here
```

Add to `C:\ClimateAI\server\.env`:
```
GROQ_API_KEY=your_key_here
```

---

## 🌦️ Weather Data

Uses [Open-Meteo](https://open-meteo.com/) — **completely free, no API key needed**.

---

## 🔐 Email & Password Authentication & MongoDB Setup

This platform features a production-ready **Email & Password Sign In and Sign Up** authentication system that persists profiles in **MongoDB** and provides robust offline dev support.

### 1. MongoDB Database Setup
The backend attempts to connect to MongoDB using the `MONGODB_URI` from your `server/.env`.

1. Ensure **MongoDB** is installed and running locally:
   * **Windows**: Run `net start MongoDB` or verify the service is running in `services.msc`.
   * **URI**: The default local connection string is already configured in `server/.env`:
     `MONGODB_URI=mongodb://localhost:27017/ClimateAI`
2. Alternatively, you can use a remote connection string (e.g., **MongoDB Atlas**) by setting the `MONGODB_URI` in `server/.env`.
3. Newly registered users will be hashed and persisted into the `users` collection.

---

### 2. Security Details
- **Password Hashing**: Passwords are securely hashed on the server side using the built-in Node.js `crypto` module's **PBKDF2** algorithm (`pbkdf2Sync` with SHA-512 and a unique random salt). This ensures production-grade security with zero external native dependency requirements.
- **Session Cache**: Authenticated user sessions are stored locally in the browser's `localStorage` to keep the user signed in across page refreshes.

---

### 3. Graceful Fallback Mode (Offline / Database-Free Dev)
If MongoDB is offline or disconnected, the application remains fully testable via a high-fidelity **In-Memory Auth Registry** running on the Node server:
* **Pre-Seeded Dev Accounts**: You can immediately log in with any of these pre-configured developer accounts (password is `password123`):
  * `alex.carter@gmail.com`
  * `elena.rostova@gmail.com`
  * `marcus.chen@gmail.com`
* **On-the-Fly Registration**: You can also register a brand new account from the "Sign Up" screen. When the database is offline, it will be cached in the server's temporary in-memory registry, allowing you to log out and log in with the new credentials during the server session.



---

## 🎨 Tech Stack

- **Frontend**: React 18 + Vite, Tailwind CSS, Framer Motion, Three.js, GSAP
- **Backend**: Node.js + Express, Socket.IO, MongoDB
- **AI**: Groq AI (llama3-8b-8192)
- **Maps**: Leaflet + React-Leaflet
- **Charts**: Recharts
- **Weather**: Open-Meteo (free)

---

## 📁 Project Structure

```
ClimateAI/
├── client/                 # React frontend
│   ├── src/
│   │   ├── pages/          # Landing, Dashboard, Assistant, Analytics, Alerts, MapPage, Admin
│   │   ├── components/
│   │   │   ├── hero/       # WeatherParticles, AnimatedGlobe
│   │   │   └── layout/     # Navbar
│   │   ├── context/        # WeatherContext (Open-Meteo API)
│   │   └── index.css       # Glassmorphism, neon effects, animations
│   └── package.json
├── server/                 # Express backend
│   ├── routes/             # weather, ai, alerts, admin
│   ├── index.js            # Socket.IO server
│   └── package.json
├── start.bat               # ← Run this to start everything!
└── README.md
```
