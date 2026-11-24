# 🏥 Arogya-ID — Portable Digital Health Record System

<p align="center">
  A unified digital healthcare identity that makes medical records accessible, portable, and secure.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-Vite-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Node.js-Backend-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white" />
</p>

---

## 📌 Overview

**Arogya-ID** is a full-stack digital healthcare platform designed to create a unified and portable medical identity for individuals.

The platform connects a patient's medical history to a unique Health ID, allowing authorized healthcare providers to access relevant medical information through a secure, consent-driven system.

It also introduces a QR-based emergency access mechanism that enables first responders to retrieve essential medical information without requiring authentication.

By combining digital health records, role-based authorization, patient consent, and emergency accessibility, Arogya-ID aims to make healthcare information more connected and accessible.

## 🎯 Problem Statement

Healthcare records are often fragmented across hospitals, clinics, laboratories, and physical documents.

This creates several challenges:

- Patients struggle to access their complete medical history across different healthcare providers.
- Doctors may lack access to important medical information during consultations.
- Emergency responders may not know a patient's blood group, allergies, or existing medical conditions.
- Sharing medical records without proper authorization creates privacy concerns.
- Patients have limited visibility into who accesses their medical information.

## 💡 Our Solution

Arogya-ID addresses these challenges through a centralized digital health identity.

Each patient receives a unique Health ID linked to their medical records. Healthcare providers can request access to patient information, while patients retain control over permissions.

In emergencies, authorized essential information can be retrieved through a QR-based public access mechanism without exposing the patient's complete medical history.

## ✨ Key Features

### 1. Unique Digital Health ID
- UUID-based unique Health ID generation.
- QR code generation during patient registration.
- Centralized identity linked to medical records.

### 2. Secure Authentication & Authorization
- JWT-based authentication.
- Role-Based Access Control (RBAC).
- Password hashing using bcrypt.
- Five distinct user roles.

### 3. Emergency QR Access
- Retrieve essential medical information through a QR code.
- No login required for emergency access.
- Displays only approved critical information:
  - Blood group
  - Allergies
  - Emergency contact
  - Major medical conditions
- Emergency access is recorded in the audit log.

### 4. Consent-Based Medical Record Sharing
- Hospitals and insurers can request patient record access.
- Patients can approve or reject access requests.
- Medical records remain restricted until consent is granted.
- Access permissions are enforced by the backend.

### 5. Comprehensive Medical Records
Healthcare providers can maintain:
- Diagnoses
- Prescriptions
- Surgical history
- Vaccination records
- Discharge summaries
- Medical documents and reports

### 6. Medical Document Vault
- Upload medical reports and prescriptions.
- Store X-rays and supporting documents.
- Local filesystem storage with an S3-compatible migration path.

### 7. Chronological Medical Timeline
- Medical events organized by date.
- Expandable record details.
- Unified view of a patient's medical journey.

### 8. Access Audit Logging
- Timestamped record access.
- Emergency access tracking.
- Visibility into who accessed medical information.

### 9. AI Health Summary
- AI summary endpoint for converting medical information into plain-language summaries.
- Currently implemented as a stub endpoint for future LLM integration.

## 👥 User Roles

| Role | Responsibilities |
|---|---|
| Patient | Manage profile, view records, upload documents, control consent and monitor access logs |
| Hospital / Doctor | Search patients, request consent and manage medical records |
| Insurer | Request authorized access to verified medical history |
| Emergency Responder | Retrieve essential emergency information through QR access |
| Pharmacist | View prescriptions with patient consent |

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Routing | React Router |
| API Communication | Axios |
| QR Code | react-qr-code |
| Backend | Node.js, Express.js |
| Authentication | JWT, bcrypt |
| Validation | Zod |
| Relational Database | SQLite, Sequelize |
| Document Database | MongoDB, Mongoose |
| File Uploads | Multer |
| Testing | Jest, Supertest |

## 🏗️ System Architecture

```text
             PATIENT / HEALTHCARE USERS
                       |
                       v
                REACT FRONTEND
                 (Vite + Axios)
                       |
                       v
                EXPRESS REST API
                       |
          +------------+------------+
          |            |            |
          v            v            v
      AUTH & RBAC   CONSENT      VALIDATION
       MIDDLEWARE   MANAGEMENT      (ZOD)
          |            |            |
          +------------+------------+
                       |
                       v
                 SERVICE LAYER
                       |
             +---------+---------+
             |                   |
             v                   v
        SQLITE DATABASE      MONGODB
        (Identity, Auth,     (Medical Records,
         Consent, Logs)       Documents)
             |                   |
             +---------+---------+
                       |
                       v
                AUDIT LOGGING
```

## 🔐 Security & Privacy

Security and patient privacy are important parts of Arogya-ID.

Implemented security measures include:

- Password hashing using bcrypt with 12 salt rounds.
- JWT authentication with 24-hour token expiry.
- Role-based authorization.
- Zod request validation.
- Consent defaults to denied.
- Emergency endpoint restricted to a four-field allowlist.
- Timestamped access logs for medical record access.
- Backend-enforced access control.

**Privacy principle:** Emergency access provides only essential medical information rather than exposing the complete patient record.

## 🚀 Getting Started

### Prerequisites

Install the following before running the application:

- Node.js 18+
- npm 9+
- MongoDB (local installation or MongoDB Atlas)
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Mohit-Sable/Arogya-ID.git
```

### 2. Navigate to the Project

```bash
cd Arogya-ID
```

### 3. Configure the Backend

```bash
cd backend
npm install
```

Create your environment configuration:

```bash
cp .env.example .env
```

Update the environment variables if required.

### 4. Seed Demo Data

```bash
npm run seed
```

This generates demo accounts for testing different application roles.

### 5. Start the Backend

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:5000
```

### 6. Configure the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:5173
```

Open the application in your browser:

http://localhost:5173

## 🧪 Testing

Run the backend test suite:

```bash
cd backend
npm test
```

The existing tests cover:

- JWT authentication middleware.
- Role-based access control.
- Emergency information field filtering.
- Patient consent workflows.
- Authorization and ownership checks.
- Prevention of unauthorized medical record access.

## 📂 Project Structure

```text
Arogya-ID/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── models/
│   │   │   ├── mongo/
│   │   │   └── sql/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   │
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── pages/
│       ├── components/
│       ├── api/
│       ├── context/
│       ├── App.jsx
│       └── index.css
│
├── package.json
└── README.md
```

## 🔮 Future Enhancements

Potential improvements for future versions:

- Integration with India's Ayushman Bharat Digital Mission (ABDM).
- ABHA-compatible health identity interoperability.
- FHIR-based medical record exchange.
- Cloud-based encrypted document storage.
- Advanced AI-powered medical record summarization.
- Multi-factor authentication.
- Mobile application for patients and healthcare providers.
- Advanced analytics for healthcare providers.

## 🎯 Project Objectives

Arogya-ID focuses on:

1. Making medical records portable across healthcare providers.
2. Improving emergency response through QR-based access.
3. Giving patients control over medical data sharing.
4. Improving healthcare information accessibility.
5. Building a secure and scalable digital healthcare infrastructure.

## 👨‍💻 Author

**Mohit Sable**

GitHub: [@Mohit-Sable](https://github.com/Mohit-Sable)

Project: [Arogya-ID](https://github.com/Mohit-Sable/Arogya-ID)

---

<p align="center">
  <b>Building a more connected, accessible, and patient-centric healthcare ecosystem.</b>
  <br/><br/>
  ⭐ If you find this project interesting, consider giving it a star!
</p>
