# 🏥 Health ID — Portable Digital Health Record System

A full-stack digital health record platform that links a single unique Health ID to a person's complete medical history, with an emergency-access mode that lets first responders retrieve life-critical info via QR scan — **no login required**.

## ✨ Features

### MVP (Implemented)
- **🆔 Health ID Generation** — Unique UUID-based Health ID with QR code on registration
- **🔐 Patient Auth & Profile** — JWT auth with RBAC (5 roles), editable health profile
- **👨‍⚕️ Hospital/Doctor Portal** — Add diagnoses, prescriptions, surgeries, vaccinations, discharge summaries
- **🚨 Emergency Mode** — Public endpoint returning ONLY blood group, allergies, emergency contact, major conditions (no login needed)
- **✅ Consent-Based Access** — Hospitals/insurers request access; patients approve/deny from dashboard
- **📝 Access Audit Log** — Every record access (including emergency) is timestamped and logged
- **📁 Document Vault** — Upload reports, X-rays, prescriptions (local filesystem, S3-swappable)
- **📋 Chronological Timeline** — All medical events sorted by date with expandable details
- **🤖 AI Health Summary** — Stub LLM endpoint for generating plain-language summaries

### Roles
| Role | Capabilities |
|------|-------------|
| **Patient** | View records, manage profile, approve/deny consent, view access logs, upload documents |
| **Hospital/Doctor** | Search patients, request consent, add medical records |
| **Insurer** | Search patients, request consent, view verified health history |
| **Emergency Responder** | Access critical info via QR scan (no login) |
| **Pharmacist** | View prescriptions (consent required) |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React (Vite), React Router, Axios, react-qr-code |
| Backend | Node.js, Express 4.x, REST API |
| SQL Database | SQLite via Sequelize (swappable to PostgreSQL) |
| Document Database | MongoDB via Mongoose |
| Auth | JWT + bcrypt, Role-Based Access Control |
| Validation | Zod schema validation |
| File Storage | Local filesystem (multer, S3-swappable) |
| Testing | Jest + Supertest |

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18+ 
- **MongoDB** running locally (or Atlas URI)
- **npm** 9+

### 1. Clone & Install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure Environment

```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local development)
```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

This creates demo users with credentials:

| Role | Email | Password |
|------|-------|----------|
| Patient | `patient@demo.com` | `patient123` |
| Hospital | `doctor@cityhospital.com` | `hospital123` |
| Insurer | `claims@healthinsure.com` | `insurer123` |

The seed script prints the patient's **Health ID** — save it for the emergency QR demo.

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (port 5000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## 🎯 Demo Walkthrough

### Flow 1: Patient Registration & QR Code
1. Go to http://localhost:5173/login
2. Click **Create Account** → Enter name, email, password → Select **Patient** role
3. See your Health ID and QR code on the dashboard
4. Fill in your health profile (blood group, allergies, medications, etc.)

### Flow 2: Hospital Adds Records
1. Login as `doctor@cityhospital.com` / `hospital123`
2. Paste the patient's Health ID in the search bar
3. Click **Request Access** → Switch to patient dashboard → **Approve** the consent
4. Back in hospital portal → Add a diagnosis/prescription → See it appear in patient's timeline

### Flow 3: Emergency QR Scan (No Login!)
1. Open an **incognito window** (or any browser with no login)
2. Navigate to: `http://localhost:5173/emergency/{HEALTH_ID}`
3. See ONLY: blood group (large), allergies, emergency contact, major conditions
4. Switch to patient dashboard → Check **Access Logs** tab → See the emergency access logged

### Flow 4: Consent Controls
1. Login as insurer (`claims@healthinsure.com` / `insurer123`)
2. Search for patient → Request access → See "Pending" status
3. Switch to patient → **Deny** the request
4. Back as insurer → Attempt to view records → Get **403 Forbidden**

## 🧪 Running Tests

```bash
cd backend
npm test
```

Tests cover:
- ✅ JWT auth middleware (valid/invalid/expired tokens)
- ✅ RBAC middleware (role enforcement, boundary conditions)
- ✅ Emergency mode field filter (asserts prescriptions/diagnoses/documents are NOT returned)
- ✅ Consent flow logic (pending → approved/denied, ownership checks, no auto-approve)

## 📁 Project Structure

```
/backend
  /src
    /config          # DB connections (Sequelize + Mongoose)
    /models
      /mongo         # MedicalRecord, Document (Mongoose schemas)
      /sql           # User, HealthIdMapping, AccessLog, ConsentRecord (Sequelize)
    /routes          # auth, patient, hospital, emergency, consent, document
    /controllers     # Thin handlers (validation + delegation)
    /services        # All business logic (consent checks, field filtering, etc.)
    /middleware      # auth (JWT), rbac, auditLog
    /utils           # qrGenerator, hashChain, seed
    app.js           # Express setup (no listen)
    server.js        # DB connect + listen
  /tests             # Jest test suites
/frontend
  /src
    /pages           # Login, PatientDashboard, HospitalPortal, InsurerPortal, EmergencyView
    /components      # Navbar, Timeline, RecordCard, QRDisplay
    /api             # Axios client + API wrappers
    /context         # AuthContext (JWT + role state)
    App.jsx          # React Router setup
    index.css        # Design system (dark theme, glassmorphism)
```

## 🔒 Security Notes

- Passwords hashed with **bcrypt** (12 salt rounds)
- JWT tokens expire after 24 hours
- Emergency endpoint **hard-enforces** a 4-field allowlist at the service layer
- All request bodies validated with **Zod** schemas
- Consent defaults to **denied** — no auto-approve
- Every access (emergency + full-record) creates an immutable **AccessLog** entry
- CORS restricted to localhost origins

## 📝 License

MIT — Built for WeMakeDevs Hackathon
