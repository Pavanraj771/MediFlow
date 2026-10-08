# MediFlow — Intelligent Healthcare Management & Clinical Decision Support System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.4+-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org)
[![SHAP](https://img.shields.io/badge/SHAP-Explainable_AI-7E22CE?style=flat-square)](https://shap.readthedocs.io)
[![HIPAA](https://img.shields.io/badge/HIPAA-Aligned_Security-0D9488?style=flat-square)](https://www.hhs.gov/hipaa)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

**MediFlow** is an enterprise-grade hospital management platform and clinical decision support system designed to unify multi-role hospital workflows—connecting Patients, Clinicians, and Hospital Administrators—with responsible, transparent, and explainable Clinical Artificial Intelligence.

---

## Table of Contents
- [Executive Overview](#executive-overview)
- [System Architecture](#system-architecture)
- [The 6 Core Modules](#the-6-core-modules)
  - [Module 1: Authentication, Identity & Role-Based Access Control (RBAC)](#module-1-authentication-identity--role-based-access-control-rbac)
  - [Module 2: Dynamic Doctor Scheduling & Appointment Management](#module-2-dynamic-doctor-scheduling--appointment-management)
  - [Module 3: Electronic Medical Records (EMR) & Clinical Consultation Cockpit](#module-3-electronic-medical-records-emr--clinical-consultation-cockpit)
  - [Module 4: Explainable AI (XAI) & Clinical Decision Support System (CDSS)](#module-4-explainable-ai-xai--clinical-decision-support-system-cdss)
  - [Module 5: Hospital Administration, Department Operations & Analytics](#module-5-hospital-administration-department-operations--analytics)
  - [Module 6: Security Governance, HIPAA Compliance & Immutable Audit Logging](#module-6-security-governance-hipaa-compliance--immutable-audit-logging)
- [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
- [End-to-End System Workflow](#end-to-end-system-workflow)
- [Technology Stack](#technology-stack)
- [Presentation Deck (PPTX)](#presentation-deck-pptx)
- [Installation & Quickstart Guide](#installation--quickstart-guide)
- [API Reference Summary](#api-reference-summary)
- [Future Roadmap](#future-roadmap)

---

## Executive Overview

Modern healthcare environments frequently suffer from three crippling systemic bottlenecks:
1. **Fragmented Software Silos:** Disconnected applications for patient registration, scheduling, clinical notes, and billing lead to data loss and clinician burnout.
2. **Scheduling Inefficiencies:** High appointment no-show rates and overlapping double-bookings waste clinical capacity and increase patient wait times.
3. **The "Black Box" Problem in Clinical AI:** Conventional machine learning models generate opaque risk percentages with no clinical reasoning, leading to distrust and rejection by licensed medical professionals.

**MediFlow solves these challenges by cleanly organizing its entire full-stack ecosystem into 6 decoupled, enterprise-grade modules.**

```
+---------------------------------------------------------------------------------------------------+
|                                              MEDIFLOW                                             |
+---------------------------------+---------------------------------+-------------------------------+
|            MODULE 1             |            MODULE 2             |           MODULE 3            |
|     Identity, Auth & RBAC       |   Doctor Scheduling & Booking   |  EMR & Clinical Consultation  |
|   (Bcrypt, JWT, Zero-Trust)     |   (Dynamic Slots, ACID Lock)    |   (Vitals, Notes, Rx Flow)    |
+---------------------------------+---------------------------------+-------------------------------+
|            MODULE 4             |            MODULE 5             |           MODULE 6            |
|    Explainable AI CDSS (XAI)    |  Hospital Operations & Analytics|  Security, HIPAA & Audit Logs |
|    (SHAP, 'What-If', Triage)    | (Roster, Capacity, Recharts KPI)|  (AES-256, Append-Only Logs)  |
+---------------------------------+---------------------------------+-------------------------------+
```

---

## System Architecture

MediFlow is built as a **4-tier modular architecture** ensuring separation of concerns, transactional reliability, sub-second latency, and horizontal scalability:

```mermaid
flowchart TB
    subgraph ClientTier ["Presentation Tier (React.js SPA)"]
        UI_Patient["Patient Self-Service Portal"]
        UI_Doctor["Doctor Clinical Cockpit"]
        UI_Admin["Hospital Executive Dashboard"]
        UI_Charts["Interactive Analytics & Vitals (Recharts)"]
    end

    subgraph AppTier ["Application Tier (Python FastAPI Engine)"]
        AuthSvc["Auth & RBAC Middleware"]
        SchedSvc["Dynamic Scheduling Engine"]
        EmrSvc["EMR & Consultation Service"]
        AdminSvc["Operations & Analytics Service"]
        AuditSvc["Audit Logging Interceptor"]
    end

    subgraph MLTier ["Decision-Support Tier (Scikit-Learn & XAI)"]
        MLPipeline["Calibrated Risk Ensemble Classifier"]
        ShapEngine["SHAP Feature Attribution Engine"]
        SimEngine["Interactive 'What-If' Simulation Service"]
    end

    subgraph DataTier ["Persistence Tier (PostgreSQL ACID Database)"]
        UsersDB[("Users & Credentials")]
        SlotsDB[("Schedules & Slots")]
        EmrDB[("Consultations & Vitals")]
        RxDB[("Prescriptions & Medicines")]
        AuditDB[("Immutable Audit Trail (Append-Only)")]
    end

    ClientTier <-->|RESTful JSON / HTTPS / JWT| AppTier
    AppTier <-->|Joblib / In-Memory Inference| MLTier
    AppTier <-->|SQLAlchemy 2.0 ORM / Connection Pool| DataTier
```

---

## The 6 Core Modules

```
====================================================================================================
MODULE AT-A-GLANCE MATRIX
====================================================================================================
Module   Module Title                     Primary Technologies       Key Business Entities
----------------------------------------------------------------------------------------------------
Mod 1    Identity, Auth & RBAC            FastAPI, PyJWT, Passlib    User, Role, RevokedToken
Mod 2    Scheduling & Appointments        PostgreSQL ACID, Pydantic  Schedule, Slot, Appointment
Mod 3    EMR & Clinical Consultation      React, Recharts, SQLA      Consultation, Vital, Prescription
Mod 4    Explainable AI Decision Support  Scikit-learn, SHAP, NumPy  RiskAssessment, ShapAttribution
Mod 5    Hospital Operations & Analytics  FastAPI, Recharts, Pandas  Department, StaffRoster, Metric
Mod 6    Security, HIPAA & Audit Trails   AES-256, TLS 1.3, SQLA     AuditLog (Append-Only)
====================================================================================================
```

---

### Module 1: Authentication, Identity & Role-Based Access Control (RBAC)

#### 1. Overview & Objectives
Module 1 serves as the security backbone of MediFlow. It establishes verifiable user identity, prevents unauthorized system access, enforces strict role demarcation, and guarantees that every API interaction is authenticated.

#### 2. Key Capabilities
- **Bcrypt Salted Hashing:** User passwords are encrypted with 12 salt rounds before database persistence, eliminating vulnerabilities to dictionary or rainbow-table attacks.
- **Stateless JWT Tokens:** Encoded with user identity, claims, and role scopes (`sub`, `role`, `exp`, `iat`) signed via HMAC-SHA256.
- **Granular Role Matrix:**
  - `PATIENT`: Limited to personal medical profile, personal appointment booking, and personal prescription history.
  - `DOCTOR`: Authorized to view assigned queues, write consultation notes, record biometric vitals, trigger AI decision support, and issue prescriptions.
  - `ADMIN`: Authorized to configure hospital rosters, onboard medical staff, view aggregated hospital KPIs, and inspect HIPAA audit logs.
- **FastAPI Dependency Guards:** Endpoints enforce access rules using `Depends(require_role(["DOCTOR", "ADMIN"]))`.
- **Client-Side Route Protection:** React Router protectors dynamically intercept route transitions based on user credentials stored in encrypted session storage.

#### 3. Data Schema
- `users`: `id` (UUID), `email` (Unique), `hashed_password` (VARCHAR), `first_name`, `last_name`, `role` (ENUM: PATIENT, DOCTOR, ADMIN), `is_active` (BOOLEAN), `created_at` (TIMESTAMP).
- `revoked_tokens`: `token_jti` (VARCHAR), `revocation_date` (TIMESTAMP).

#### 4. Primary API Endpoints
| HTTP Method | Route | Description | Auth Scope |
|:---:|:---|:---|:---|
| `POST` | `/api/v1/auth/register` | Register a new patient account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate credentials; return JWT bearer access token | Public |
| `GET` | `/api/v1/auth/me` | Fetch active profile and permissions | Authenticated |
| `POST` | `/api/v1/auth/logout` | Revoke session token and clear active state | Authenticated |

---

### Module 2: Dynamic Doctor Scheduling & Appointment Management

#### 2. Overview & Objectives
Module 2 manages clinician working hours, dynamically converts availability rules into bookable consultation slots, and enforces transactional consistency to eradicate double-booking and schedule clashes.

#### 2. Key Capabilities
- **Dynamic Slot Generation Engine:**
  - Clinicians configure working days, shift start/end times (e.g., Mon–Fri, 09:00–17:00), and custom slot durations (standard 30 minutes).
  - Break periods, emergency blocks, and physician leaves are automatically subtracted from available slot inventories.
- **ACID-Compliant Conflict Prevention:**
  - Employs PostgreSQL serializable transaction isolation and composite unique constraints (`doctor_id`, `slot_timestamp`, `status != 'CANCELLED'`).
  - Concurrent booking requests for identical slots are serialized, guaranteeing zero double-booking.
- **Appointment State Machine:**
  - Status transitions: `SCHEDULED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` or `CANCELLED`.
- **Self-Service Patient Portal:**
  - Patients filter available slots by department, doctor specialty, or date, and book or reschedule instantly.
  - Automated cancellation workflows restore the slot inventory for other patients.

#### 3. Data Schema
- `doctor_schedules`: `id`, `doctor_id` (FK), `day_of_week` (INT), `shift_start` (TIME), `shift_end` (TIME), `slot_duration_minutes` (INT), `is_active` (BOOL).
- `appointment_slots`: `id`, `doctor_id` (FK), `start_time` (TIMESTAMP), `end_time` (TIMESTAMP), `is_booked` (BOOL).
- `appointments`: `id`, `patient_id` (FK), `doctor_id` (FK), `slot_id` (FK), `status` (ENUM), `reason_for_visit` (TEXT), `booked_at` (TIMESTAMP).

#### 4. Primary API Endpoints
| HTTP Method | Route | Description | Auth Scope |
|:---:|:---|:---|:---|
| `POST` | `/api/v1/schedules/configure` | Set physician shift parameters and recurring availability | Doctor / Admin |
| `GET` | `/api/v1/schedules/doctors/{id}/slots` | Retrieve bookable 30-min slots for a specified date | Authenticated |
| `POST` | `/api/v1/appointments/book` | Reserve an open consultation slot transactionally | Patient |
| `PUT` | `/api/v1/appointments/{id}/reschedule` | Move appointment to a new open slot | Patient / Doctor |
| `DELETE` | `/api/v1/appointments/{id}/cancel` | Cancel an upcoming booking and free up the slot | Patient / Doctor |

---

### Module 3: Electronic Medical Records (EMR) & Clinical Consultation Cockpit

#### 1. Overview & Objectives
Module 3 serves as the primary clinical workstation for physicians. It replaces manual paperwork with structured electronic consultation documentation, longitudinal vital signs tracking, and digital prescription issuance.

#### 2. Key Capabilities
- **Structured Consultation Cockpit:**
  - Captures Chief Complaints, Clinical Observations, Physical Examination Findings, and Differential Diagnoses.
  - Aligns with standard ICD diagnostic classifications for clinical categorization.
- **Biometric Vitals Tracker:**
  - Records Systolic & Diastolic Blood Pressure (mmHg), Resting Heart Rate (bpm), Fasting Blood Glucose (mg/dL), Body Temperature (°C), Oxygen Saturation (SpO2 %), and BMI.
  - Interactive longitudinal line charts (rendered via Recharts) highlight biometric trends across historical visits.
  - Threshold alerts visually flag out-of-range parameters (e.g., BP $> 140/90$ mmHg or SpO2 $< 95\%$).
- **Structured Digital Prescriptions (Rx):**
  - Generates itemized medications specifying Drug Name, Dosage (mg/ml), Frequency (e.g., 1-0-1), Administration Route (Oral, IV), Course Duration (Days), and Special Diet Instructions.
  - Automatically updates the patient's personal health timeline for instant review and export.

#### 3. Data Schema
- `consultations`: `id`, `appointment_id` (FK), `patient_id` (FK), `doctor_id` (FK), `chief_complaint` (TEXT), `clinical_notes` (TEXT), `diagnosis_code` (VARCHAR), `consultation_date` (TIMESTAMP).
- `patient_vitals`: `id`, `consultation_id` (FK), `patient_id` (FK), `systolic_bp` (INT), `diastolic_bp` (INT), `heart_rate` (INT), `blood_glucose` (FLOAT), `bmi` (FLOAT), `spo2` (FLOAT), `recorded_at` (TIMESTAMP).
- `prescriptions`: `id`, `consultation_id` (FK), `patient_id` (FK), `doctor_id` (FK), `instructions` (TEXT), `created_at` (TIMESTAMP).
- `prescription_items`: `id`, `prescription_id` (FK), `medication_name` (VARCHAR), `dosage` (VARCHAR), `frequency` (VARCHAR), `duration_days` (INT).

#### 4. Primary API Endpoints
| HTTP Method | Route | Description | Auth Scope |
|:---:|:---|:---|:---|
| `POST` | `/api/v1/emr/consultations` | Save finalized clinical consultation notes | Doctor |
| `POST` | `/api/v1/emr/vitals` | Record patient biometric measurements | Doctor |
| `POST` | `/api/v1/emr/prescriptions` | Generate structured multi-item prescription | Doctor |
| `GET` | `/api/v1/emr/patients/{id}/timeline` | Retrieve chronological medical history & past visits | Doctor / Patient (Own) |

---

### Module 4: Explainable AI (XAI) & Clinical Decision Support System (CDSS)

#### 1. Overview & Objectives
Module 4 enhances physician decision-making with calibrated machine learning models. Crucially, it demystifies traditional "black-box" predictions by delivering mathematically rigorous, feature-level explainability through SHAP (SHapley Additive exPlanations).

#### 2. Key Capabilities
- **Validated Predictive Risk Engine:**
  - Machine learning ensemble classifier trained and validated on clinical cardiovascular and chronic disease biometrics.
  - Input features: Age, Biological Sex, Resting Blood Pressure, Serum Cholesterol, Fasting Blood Sugar, Resting ECG, Maximum Heart Rate Achieved, Exercise-Induced Angina, and ST Depression (Oldpeak).
  - Triage Calibration: Outputs continuous risk probabilities ($0.0 \rightarrow 1.0$) categorized into **LOW**, **MODERATE**, and **HIGH RISK**, tuned for high sensitivity/recall to minimize false negatives during early triage.
- **Explainability (SHAP XAI Engine):**
  - Uses Shapley values from cooperative game theory to decompose the final risk score into individual biomarker attributions.
  - Clinicians view visual attribution bars showing exactly how each biometric influenced the score (e.g., *Systolic BP 155 mmHg: +22% Risk*, *Age 62: +14% Risk*, *Normal ECG: -8% Risk*).
- **Interactive "What-If" Sensitivity Simulation:**
  - Physicians can dynamically adjust modifiable risk parameters (e.g., lowering Systolic BP from 155 to 125 mmHg or lowering serum cholesterol) in the UI to demonstrate projected health gains to patients.
- **Strict Clinical & Ethical Guardrails:**
  - **Advisory Status:** Prominent UI disclaimer affirms that CDSS predictions are decision-support aids and **never** a substitute for licensed medical judgment.
  - **Human-in-the-Loop:** Only authenticated physicians can trigger and review model inferences; predictions are never published directly as diagnoses.
  - **Clinician Override:** Doctors retain full authority to confirm, modify, or dismiss AI assessments with mandatory rationale documentation.

#### 3. Data Schema
- `cdss_risk_assessments`: `id`, `consultation_id` (FK), `patient_id` (FK), `doctor_id` (FK), `predicted_score` (FLOAT), `risk_category` (VARCHAR), `model_version` (VARCHAR), `clinician_feedback` (TEXT), `override_flag` (BOOL), `assessed_at` (TIMESTAMP).
- `cdss_shap_attributions`: `id`, `assessment_id` (FK), `feature_name` (VARCHAR), `feature_value` (FLOAT), `shap_contribution` (FLOAT).

#### 4. Primary API Endpoints
| HTTP Method | Route | Description | Auth Scope |
|:---:|:---|:---|:---|
| `POST` | `/api/v1/cdss/assess-risk` | Execute risk assessment and compute SHAP values | Doctor |
| `POST` | `/api/v1/cdss/simulate-intervention` | Run real-time "What-If" sensitivity simulations | Doctor |
| `GET` | `/api/v1/cdss/assessments/{id}/explain` | Retrieve detailed feature attribution breakdown | Doctor |
| `POST` | `/api/v1/cdss/assessments/{id}/feedback` | Record clinician confirmation or override notes | Doctor |

---

### Module 5: Hospital Administration, Department Operations & Analytics

#### 1. Overview & Objectives
Module 5 provides hospital executives, medical directors, and administrative supervisors with live operational visibility, departmental load-balancing tools, and staff directory governance.

#### 2. Key Capabilities
- **Hospital Staff & Roster Management:**
  - Onboard physicians, verify clinical licensing, and assign medical departments (Cardiology, Neurology, Pediatrics, Orthopedics, General Medicine).
  - Manage physician consultation room allocations and active shift assignments.
- **Operational Throughput Intelligence:**
  - **Patient Footfall:** Tracks hourly, daily, and monthly visit volumes to detect peak arrival surges.
  - **Departmental Load Factor:** Evaluates appointment distributions across units to avoid physician overwork.
  - **Wait-Time Analytics:** Calculates average duration from patient check-in to consultation completion.
  - **Capacity Utilization:** Highlights underutilized specialty slots and pinpoints bottlenecks.
- **Executive KPI Dashboard:**
  - Interactive charts (Recharts) visualizing hospital bed/slot capacity, completed consultations, and cancellation trends.
  - One-click export of administrative reports in CSV or PDF formats.

#### 3. Data Schema
- `departments`: `id`, `name` (VARCHAR), `code` (VARCHAR), `head_doctor_id` (FK), `description` (TEXT).
- `doctor_profiles`: `id`, `user_id` (FK), `department_id` (FK), `license_number` (VARCHAR), `specialization` (VARCHAR), `consultation_fee` (FLOAT).
- `hospital_operational_metrics`: `id`, `metric_date` (DATE), `department_id` (FK), `total_visits` (INT), `avg_wait_minutes` (FLOAT), `cancellation_rate` (FLOAT).

#### 4. Primary API Endpoints
| HTTP Method | Route | Description | Auth Scope |
|:---:|:---|:---|:---|
| `POST` | `/api/v1/admin/doctors/onboard` | Onboard and license clinical staff | Admin |
| `GET` | `/api/v1/admin/analytics/throughput` | Retrieve hospital-wide footfall & wait times | Admin |
| `GET` | `/api/v1/admin/analytics/department-load` | Fetch real-time department load balances | Admin |
| `GET` | `/api/v1/admin/departments` | List all hospital departments and active roster | Admin / Public |

---

### Module 6: Security Governance, HIPAA Compliance & Immutable Audit Logging

#### 1. Overview & Objectives
Module 6 guarantees data privacy, protects sensitive Protected Health Information (PHI), and satisfies healthcare compliance frameworks (such as HIPAA Security and Privacy Rules) through immutable audit trails.

#### 2. Key Capabilities
- **Protected Health Information (PHI) Protection:**
  - Clinical records, diagnoses, and lab biometrics are shielded via role-scoped data isolation.
  - Patients can strictly query only their own medical history; doctors can only access records of patients with scheduled or active visits.
- **Encryption Standards:**
  - **Data at Rest:** Critical biometric fields and credentials protected via AES-256 encryption.
  - **Data in Transit:** Enforced TLS 1.3 encryption across all client-to-server and inter-service communications.
- **Immutable, Append-Only Audit Logging:**
  - Interceptors record every read (`VIEW`), creation (`CREATE`), update (`UPDATE`), or cancellation (`DELETE`) of medical data.
  - Audit records capture Actor User ID, Actor Role, Resource Entity, Resource ID, Action Type, Client IP Address, User Agent, and UTC Timestamp.
  - Database rules enforce strictly append-only behavior (no `UPDATE` or `DELETE` permissions on audit tables).
- **Forensic Regulatory Traceability:**
  - Enables hospital compliance officers to generate tamper-evident audit logs during official regulatory inspections.

#### 3. Data Schema
- `audit_logs`: `id` (BIGINT AUTO_INCREMENT), `actor_user_id` (UUID), `actor_role` (VARCHAR), `action` (ENUM: VIEW, CREATE, UPDATE, DELETE), `resource_type` (VARCHAR), `resource_id` (VARCHAR), `ip_address` (VARCHAR), `user_agent` (VARCHAR), `timestamp` (TIMESTAMP WITH TIME ZONE, DEFAULT NOW()).

#### 4. Primary API Endpoints
| HTTP Method | Route | Description | Auth Scope |
|:---:|:---|:---|:---|
| `GET` | `/api/v1/audit/logs` | Query filtered system audit logs (by date, actor, resource) | Admin / Compliance |
| `POST` | `/api/v1/audit/export-report` | Generate official compliance audit log report | Admin / Compliance |
| `GET` | `/api/v1/audit/compliance-status` | Verify cryptographic log integrity and access policies | Admin / Compliance |

---

## Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ DOCTOR_PROFILES : "extends"
    USERS ||--o{ APPOINTMENTS : "books as patient"
    USERS ||--o{ APPOINTMENTS : "conducts as doctor"
    USERS ||--o{ AUDIT_LOGS : "acts in"
    
    DEPARTMENTS ||--o{ DOCTOR_PROFILES : "employs"
    
    DOCTOR_PROFILES ||--o{ DOCTOR_SCHEDULES : "defines"
    DOCTOR_PROFILES ||--o{ APPOINTMENT_SLOTS : "generates"
    
    APPOINTMENT_SLOTS ||--|| APPOINTMENTS : "reserved in"
    
    APPOINTMENTS ||--o| CONSULTATIONS : "produces"
    
    CONSULTATIONS ||--o{ PATIENT_VITALS : "captures"
    CONSULTATIONS ||--o| PRESCRIPTIONS : "issues"
    CONSULTATIONS ||--o{ CDSS_RISK_ASSESSMENTS : "triggers"
    
    PRESCRIPTIONS ||--o{ PRESCRIPTION_ITEMS : "contains"
    
    CDSS_RISK_ASSESSMENTS ||--o{ CDSS_SHAP_ATTRIBUTIONS : "explains via"

    USERS {
        uuid id PK
        string email UK
        string hashed_password
        string role "PATIENT | DOCTOR | ADMIN"
        string first_name
        string last_name
        timestamp created_at
    }

    APPOINTMENTS {
        uuid id PK
        uuid patient_id FK
        uuid doctor_id FK
        uuid slot_id FK
        string status "SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED"
        timestamp booked_at
    }

    CONSULTATIONS {
        uuid id PK
        uuid appointment_id FK
        uuid patient_id FK
        uuid doctor_id FK
        text chief_complaint
        text clinical_notes
        string diagnosis_code
        timestamp consultation_date
    }

    PATIENT_VITALS {
        uuid id PK
        uuid consultation_id FK
        int systolic_bp
        int diastolic_bp
        int heart_rate
        float blood_glucose
        float bmi
        float spo2
    }

    CDSS_RISK_ASSESSMENTS {
        uuid id PK
        uuid consultation_id FK
        float predicted_score
        string risk_category "LOW | MODERATE | HIGH"
        text clinician_feedback
        boolean override_flag
    }

    AUDIT_LOGS {
        bigint id PK
        uuid actor_user_id FK
        string action "VIEW | CREATE | UPDATE | DELETE"
        string resource_type
        string ip_address
        timestamp timestamp
    }
```

---

## End-to-End System Workflow

The following sequence illustrates how the **6 Modules** cooperate to deliver a cohesive clinical interaction:

```mermaid
sequenceDiagram
    autonumber
    actor Patient
    actor Doctor
    actor Admin
    participant Mod1 as Mod 1: Auth & RBAC
    participant Mod2 as Mod 2: Scheduling
    participant Mod3 as Mod 3: EMR & Notes
    participant Mod4 as Mod 4: Explainable AI
    participant Mod5 as Mod 5: Hospital Ops
    participant Mod6 as Mod 6: Audit Log

    Note over Admin,Mod5: Phase 1: Onboarding & Configuration
    Admin->>Mod1: Register Doctor Account
    Admin->>Mod5: Assign Department & Verify Medical License
    Doctor->>Mod2: Set Weekly Shift Schedule (09:00 - 17:00, 30-min slots)
    Mod2->>Mod2: Generate Open Bookable Slots

    Note over Patient,Mod2: Phase 2: Booking & Check-In
    Patient->>Mod1: Login with JWT Credentials
    Patient->>Mod2: Filter Slots by Department & Doctor
    Patient->>Mod2: Confirm Slot Booking (ACID Lock)
    Mod2->>Mod6: Log Booking Event (Timestamp, User IP)

    Note over Doctor,Mod4: Phase 3: Clinical Consultation & AI Assistance
    Doctor->>Mod3: Open Patient Clinical Cockpit
    Mod3->>Mod6: Log PHI Access Event
    Doctor->>Mod3: Record Patient Vitals (BP, Glucose, HR)
    Doctor->>Mod4: Request Cardiovascular Risk Stratification
    Mod4->>Mod4: Run Ensemble Model & Compute SHAP Values
    Mod4-->>Doctor: Return Risk Score (68% - High) + SHAP Feature Contributions
    Doctor->>Mod4: Simulate 'What-If' (Lowering BP to 120 mmHg)
    Doctor->>Mod3: Document Final Diagnosis & Generate Itemized Prescription
    Mod3->>Mod2: Update Appointment Status to COMPLETED

    Note over Patient,Mod5: Phase 4: Follow-up & Intelligence
    Patient->>Mod3: View Prescriptions & Consultation Summary from Timeline
    Admin->>Mod5: Inspect Live Hospital Throughput & Department Analytics
    Mod6->>Admin: Review Immutable Audit Logs for HIPAA Compliance
```

---

## Technology Stack

| Architectural Layer | Technology | Primary Role in MediFlow |
|:---|:---|:---|
| **Presentation Tier** | **React.js 18** | High-performance Single Page Application (SPA) architecture |
| | **Vite** | Next-generation build tool with instant Hot Module Replacement (HMR) |
| | **Tailwind CSS** | Custom clinical color tokens (Teal `#0D9488`, Slate `#0F172A`) |
| | **Recharts** | Interactive SVG visualizations for vital trends and department loads |
| **Application Tier** | **Python 3.11+ / FastAPI** | Asynchronous, high-concurrency RESTful web API engine |
| | **Pydantic v2** | High-speed schema validation, serialization, and OpenAPI typing |
| | **PyJWT & Passlib** | Stateless JWT bearer authentication and salted 12-round Bcrypt hashing |
| **Persistence Tier** | **PostgreSQL 15+** | ACID-compliant relational persistence and serializable transactions |
| | **SQLAlchemy 2.0** | Modern declarative Object-Relational Mapping (ORM) |
| | **Alembic** | Automated database schema migrations and versioning |
| **Decision-Support Tier** | **Scikit-Learn 1.4+** | Calibrated ensemble classifiers for chronic risk triage |
| | **SHAP** | Model-agnostic feature attribution for transparent clinical explainability |
| | **NumPy & Pandas** | High-speed matrix vectorization and feature preprocessing |
| | **Joblib** | Model serialization and thread-safe pipeline loading |

---

## Presentation Deck (PPTX)

A complete **12-slide, widescreen (16:9) executive presentation deck** has been engineered and generated in the project root:

- **Generated PPT File:** [`MediFlow_6_Modules_Presentation.pptx`](file:///c:/Users/PAVAN%20RAJ/Desktop/MediFlow/MediFlow_6_Modules_Presentation.pptx)
- **Primary PPT File:** [`MediFlow_Presentation.pptx`](file:///c:/Users/PAVAN%20RAJ/Desktop/MediFlow/MediFlow_Presentation.pptx)
- **Generator Script:** [`generate_presentation.py`](file:///c:/Users/PAVAN%20RAJ/Desktop/MediFlow/generate_presentation.py)

### Slide Structure Overview
1. **Slide 1:** Title & Project Identity (MediFlow Overview, 6-Module Paradigm, Tech Stack)
2. **Slide 2:** Executive Summary (Visual 6-Module Architectural Grid)
3. **Slide 3:** Module 1 Deep Dive (Authentication, Identity & Role-Based Access Control)
4. **Slide 4:** Module 2 Deep Dive (Dynamic Doctor Scheduling & Transactional Appointments)
5. **Slide 5:** Module 3 Deep Dive (Electronic Medical Records & Clinical Consultation Cockpit)
6. **Slide 6:** Module 4 Deep Dive (Explainable AI Decision Support, SHAP & Ethical Guardrails)
7. **Slide 7:** Module 5 Deep Dive (Hospital Administration, Operations & Executive Analytics)
8. **Slide 8:** Module 6 Deep Dive (Security Governance, HIPAA Readiness & Immutable Audit)
9. **Slide 9:** Multi-Tier Technology Stack & Architectural Data Flow
10. **Slide 10:** End-to-End Inter-Module Workflow & Patient Lifecycle (4 Phases)
11. **Slide 11:** Clinical Impact, Performance Benchmarks & Hospital ROI (60% Paperwork Cut)
12. **Slide 12:** Technological Roadmap, Future Scope & Q&A Discussion

> Every slide includes custom clinical color palettes, rounded card containers, status badges, bullet points, and **complete, professional speaker notes**.

To regenerate the deck at any time:
```bash
python generate_presentation.py
```

---

## Installation & Quickstart Guide

### Google Sign-In Setup

Google sign-in uses a Google OAuth **Web application** client ID. Create one in the Google Cloud Console, add the frontend origin (for example `http://localhost:5173`) as an authorized JavaScript origin, and place the same client ID in both `frontend/.env.local` (`VITE_GOOGLE_CLIENT_ID`) and `backend/.env` (`GOOGLE_CLIENT_ID`). Example variable names are in `frontend/.env.example` and `backend/.env.example`. Restart the frontend and backend after setting the values. Google registration creates a patient account; doctor access still requires an administrator-approved request.

### 1. Prerequisites
- **Python:** Version 3.10, 3.11, or 3.12+
- **Node.js:** Version 18.x or 20.x+
- **PostgreSQL:** Version 14 or higher (or local SQLite for dev)

### 2. Backend Setup
```bash
# Clone the repository
git clone https://github.com/your-org/mediflow.git
cd mediflow

# Create and activate Python virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install required Python dependencies
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose passlib bcrypt scikit-learn shap pandas numpy python-pptx
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
# Application Settings
APP_NAME=MediFlow
ENVIRONMENT=development
SECRET_KEY=super-secure-random-secret-key-32-chars-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Database Connection
DATABASE_URL=postgresql://mediflow_user:password@localhost:5432/mediflow_db

# Machine Learning Engine
MODEL_PATH=./ml_models/cardio_risk_pipeline.joblib
```

### 4. Database Initialization
```bash
# Run schema migrations
alembic upgrade head
```

### 5. Running the Application Engine
```bash
# Launch FastAPI development server with hot-reload
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
- Interactive Swagger API Documentation: `http://localhost:8000/docs`
- ReDoc Documentation: `http://localhost:8000/redoc`

### 6. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Web Application Interface: `http://localhost:5173`

---

## API Reference Summary

All API routes follow RESTful conventions, return structured JSON, and enforce standard HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).

```
/api/v1
  ├── /auth
  │     ├── POST /register               # Register patient account
  │     ├── POST /login                  # Retrieve JWT token
  │     ├── GET  /me                     # Get active profile
  │     └── POST /logout                 # Invalidate session
  ├── /schedules
  │     ├── POST /configure              # Doctor sets availability
  │     └── GET  /doctors/{id}/slots     # View open 30-min slots
  ├── /appointments
  │     ├── POST /book                   # Transactionally reserve slot
  │     ├── PUT  /{id}/reschedule        # Move to alternative slot
  │     ├── DELETE /{id}/cancel          # Cancel appointment
  │     └── GET  /my                     # Patient's booked visits
  ├── /emr
  │     ├── POST /consultations          # Save doctor consultation
  │     ├── POST /vitals                 # Record biometric vitals
  │     ├── POST /prescriptions          # Issue itemized Rx
  │     └── GET  /patients/{id}/timeline # View longitudinal history
  ├── /cdss
  │     ├── POST /assess-risk            # Run ML risk + SHAP values
  │     ├── POST /simulate-intervention  # 'What-If' sensitivity test
  │     └── POST /assessments/{id}/feedback # Doctor override / notes
  ├── /admin
  │     ├── POST /doctors/onboard        # Add and verify medical staff
  │     ├── GET  /analytics/throughput   # Footfall & wait-time KPIs
  │     └── GET  /analytics/department-load # Department load factors
  └── /audit
        ├── GET  /logs                   # Query immutable access log
        └── POST /export-report          # Export HIPAA audit documentation
```

---

## Future Roadmap

- [ ] **Medical Imaging Deep Learning (Phase 2):** Incorporate PyTorch ResNet-50 CNN inference pipelines for Chest X-Ray pneumonia screening and CT lesion triage.
- [ ] **Clinical NLP Extraction (Phase 2):** Integrate BioBERT / ClinicalBERT to parse unstructured PDF pathology and lab reports into structured EMR records.
- [ ] **FHIR / HL7 Interoperability (Phase 3):** Implement HL7 FHIR (Fast Healthcare Interoperability Resources) v4 standard APIs for seamless two-way data sync with external hospital legacy systems.
- [ ] **Telemedicine WebRTC Engine (Phase 3):** Embed HIPAA-compliant end-to-end encrypted video calling directly into the doctor-patient consultation screen.
- [ ] **Wearable Biometric Ingestion (Phase 4):** Connect real-time continuous glucose monitor (CGM) and smartwatch heart rate feeds to trigger proactive triage alerts.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

*MediFlow is engineered to empower clinicians, protect patient privacy, and advance healthcare delivery through transparent, explainable technology.*
