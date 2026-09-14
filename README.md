# DocScreen — AI Document Fraud Screening System
### Step-by-Step Setup & Usage Guide · SIH 2026

---

## 📋 What is DocScreen?

DocScreen is an AI-powered system that detects fake and tampered identity documents (Aadhaar, PAN, Voter ID, etc.). It uses 8 forensic analysis engines — computer vision, OCR, machine learning (Isolation Forest), and metadata forensics — to produce a **0–100 Risk Score** with a transparent explanation of every flag it raises.

---

## ⚙️ Prerequisites — Install These First

| Tool | Version | Where to Get |
|------|---------|--------------|
| Python | 3.11 or higher | https://www.python.org/downloads/ |
| Node.js | 18 or higher | https://nodejs.org/ |
| Tesseract OCR | Latest | `choco install tesseract` (or download from GitHub UB-Mannheim) |
| Git (optional) | Any | https://git-scm.com/ |

> **Windows Tip:** After installing Python, make sure to tick **"Add Python to PATH"** in the installer.

---

## 🚀 Step 1: Start the Entire Application (1 Click)

**Double-click** the file:
```
start_docscreen.bat
```

This single file automatically:
1. Starts the **FastAPI Backend** on `http://localhost:8000`
2. Starts the **Next.js Frontend** on `http://localhost:3000`
3. Waits 6 seconds for both servers to initialize
4. **Opens DocScreen in Zen Browser** (or your default browser)

> ⚠️ Keep both black terminal windows open while using the app. Closing them stops the servers.

---

## 🔧 Step 2: First-Time Setup Only (Do This Once)

If you are running DocScreen for the first time:

### 2A — Set Up the Backend

Open a terminal, navigate to the `backend/` folder, and run:

```bash
# Go into backend folder
cd backend

# Create a virtual environment
python -m venv venv

# Activate it (Windows)
venv\Scripts\activate

# Install all Python dependencies
pip install -r requirements.txt

# Generate synthetic demo documents (creates data/synthetic/ folder)
cd ..
python scripts\generate_demo_documents.py

# Train the ML anomaly model (creates models_store/isolation_forest.pkl)
python scripts\train_anomaly_model.py
```

> ✅ After this, the `models_store/` folder will contain `isolation_forest.pkl` and `data/synthetic/` will have 8 demo documents.

### 2B — Set Up the Frontend

```bash
# Go into frontend folder
cd frontend

# Install Node.js packages
npm install
```

> ✅ This creates the `node_modules/` folder. Only needs to be done once.

---

## 🎮 Step 3: Using the Website — Full Demo Flow

Once the site opens at **http://localhost:3000**, follow this sequence:

### 3A — Analyze a Document (Upload)
1. Click **"Analyze"** in the left sidebar.
2. Click the **upload zone** and select any identity document image (JPG, PNG, PDF).
3. Watch the **13-layer pipeline** process in real time (Visual → OCR → Forensics → ML → Risk Fusion).
4. View your **Risk Score** and the breakdown of findings.

### 3B — Demo Mode (No Upload Needed — Best for Demos)
1. On the Analyze page, click **"Demo Mode"** button at the top right.
2. Pick a scenario:
   - **Authentic Aadhaar** → Expected: 🟢 LOW RISK (~12/100)
   - **Text Tampered PAN** → Expected: 🔴 HIGH RISK (~84/100)
   - **Forged Date Voter ID** → Expected: 🔴 HIGH RISK (~78/100)

### 3C — Inspect the Evidence (Explainable AI)
After any analysis, explore the result tabs:
- **Key Findings** → See exactly which forensic signals fired and why.
- **OCR Fields** → Click any extracted field (Name, DOB, ID Number) to highlight its bounding box on the document image.
- **Risk Score Breakdown** → See the weighted contribution of all 8 forensic engines.

### 3D — Human Review (HITL)
1. Click **"Review Document"** button.
2. Choose **Approve**, **Reject**, or **Request More Info**.
3. Add optional reviewer notes.
4. Click **Submit** — the decision is logged to the database immediately.

### 3E — Other Features
| Page | URL | What It Does |
|------|-----|-------------|
| Risk Queue | `/risk-queue` | Shows all Medium/High risk docs pending human review |
| Analytics | `/analytics` | Live charts — fraud rates, risk distribution, engine stats |
| Documents | `/documents` | Full history of every document ever analyzed |
| Compare | `/compare` | Side-by-side comparison of two documents |
| Settings | `/settings` | Backend health check, API status, configuration |

---

## 🩺 Step 4: Health Check

Verify everything is running correctly:

| Check | URL | Expected |
|-------|-----|----------|
| Frontend | http://localhost:3000 | DocScreen dashboard loads |
| Backend Health | http://localhost:8000/api/health | `{"status": "healthy"}` |
| Swagger API Docs | http://localhost:8000/docs | Full interactive API docs |

---

## 📁 Project Structure

```
DocScreen/
├── backend/                    ← FastAPI Python backend
│   ├── app/
│   │   ├── api/routes/         ← API endpoints (analyze, review, demo, etc.)
│   │   ├── anomaly/            ← Isolation Forest ML model loader
│   │   ├── forensics/          ← EXIF/metadata analysis
│   │   ├── ocr/                ← Tesseract + RapidOCR engines
│   │   ├── pipelines/          ← Main 13-stage inspection pipeline
│   │   ├── risk/               ← Risk fusion engine (weighted scoring)
│   │   ├── templates/          ← Template classifier and layout validator
│   │   └── vision/             ← OpenCV preprocessor + ELA tamper detector
│   ├── requirements.txt        ← Python dependencies
│   └── Dockerfile              ← Docker container definition
│
├── frontend/                   ← Next.js React frontend
│   ├── app/                    ← Pages (analyze, risk-queue, analytics, etc.)
│   ├── components/             ← UI components (stepper, review modal, OCR panel)
│   ├── lib/api.ts              ← API client (connects frontend to backend)
│   └── package.json            ← Node.js dependencies
│
├── scripts/
│   ├── generate_demo_documents.py  ← Creates 8 synthetic demo documents
│   ├── train_anomaly_model.py      ← Trains the Isolation Forest model
│   └── evaluate_model.py          ← Evaluates model performance
│
├── data/synthetic/             ← Auto-generated demo document images
├── models_store/               ← Trained ML model (isolation_forest.pkl)
│
├── start_docscreen.bat         ← 1-click launcher (double-click to start)
├── docker-compose.yml          ← Docker multi-service setup
└── render.yaml                 ← Render.com cloud deployment config
```

---

## 🌐 Online Deployment

DocScreen is deployed live at:
- **Frontend:** https://docscreen-frontend.onrender.com
- **Backend API:** https://docscreen-backend.onrender.com
- **API Docs (live):** https://docscreen-backend.onrender.com/docs

> ⚠️ Render free tier may take 30–60 seconds to wake up on first visit (cold start).

---

## 🔬 Risk Score Signals Reference

| Signal | Weight | Description |
|--------|--------|-------------|
| Visual Tamper & ELA | 25% | Error Level Analysis, edge noise, copy-move detection |
| Template & Layout | 15% | Aspect ratio, emblem alignment, header validation |
| Cross-Field Consistency | 15% | DOB vs Age, PAN checksum, semantic coherence |
| ML Anomaly (Isolation Forest) | 15% | Zero-day outlier detection using trained model |
| OCR & Text Anomalies | 10% | Confidence scores, font inconsistency, encoding errors |
| Pattern & Temporal | 10% | Regex conformity, future issue dates, sequence logic |
| Metadata & EXIF | 5% | Photoshop/GIMP signatures, missing camera profiles |
| Image Quality | 5% | Blur variance, contrast, glare detection |

**Thresholds:**  
🟢 0–30 = LOW RISK · 🟡 31–65 = MEDIUM RISK · 🔴 66–100 = HIGH RISK

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend terminal shows `ModuleNotFoundError` | Run `pip install -r requirements.txt` in `backend/` with venv activated |
| Frontend shows "Cannot connect" | Make sure backend is running at port 8000 |
| `isolation_forest.pkl` not found | Run `python scripts\train_anomaly_model.py` from root |
| Tesseract not found error | Install Tesseract and add it to Windows PATH |
| Port 8000 already in use | Close any other running backend or use `npx kill-port 8000` |

---

## ⚠️ Disclaimer

DocScreen is a **prototype for SIH 2026**. It uses entirely **synthetic, fictional demo documents** and is intended as a decision-support screening tool for academic and research purposes only. It is NOT a legally certified document authenticator and should NOT be used in production government contexts without appropriate validation.
