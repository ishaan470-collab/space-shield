# SpaceShield AI

AI-Powered Space Situational Awareness & Satellite Collision Risk Prediction Platform.

SpaceShield AI leverages Machine Learning models trained on physical orbital parameters (complying with Kepler's Laws) and live satellite telemetry from the Celestrak database to forecast proximity collision dangers between active spacecraft and space debris.

---

## Technical Stack

*   **Machine Learning**: Python, Scikit-learn (Gradient Boosting Classifier), SHAP (Explainable AI), Pandas, NumPy, Joblib
*   **Backend Server**: FastAPI, SQLAlchemy, SQLite, Uvicorn
*   **Frontend Client**: Next.js (App Router), TypeScript, Tailwind CSS, Recharts (Data Visualization), jsPDF (PDF Dossiers)

---

## Repository Structure

```
d:/space shield/
├── ml/                      # Machine Learning pipeline
│   ├── dataset/             # Dataset generation and storage
│   ├── training/            # Model training scripts
│   └── saved_models/        # Saved model binaries (.pkl)
├── backend/                 # FastAPI server
│   ├── app/                 # Main API application code
│   │   ├── api/             # API routes (Auth, Predict, Analytics)
│   │   ├── database/        # DB connection and session
│   │   ├── models/          # DB Schemas & ORM models
│   │   └── services/        # Satellite API & ML inference services
│   ├── requirements.txt     # Python dependencies
│   └── tests/               # Automated unit tests
├── frontend/                # Next.js client
│   ├── app/                 # Next.js pages and routing
│   ├── components/          # Reusable UI components
│   ├── services/            # API integration module
│   ├── utils/               # PDF reports generation helper
│   └── package.json         # Node.js dependencies
└── README.md                # Project documentation
```

---

## Local Setup Instructions

### 1. Prerequisite Installations

Ensure you have Python (version >= 3.8) and Node.js (version >= 18) installed on your system.

### 2. Machine Learning & Backend Setup

1.  Navigate to the workspace root and install Python libraries:
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  Generate the synthetic Keplerian dataset and train the ML models:
    ```bash
    python ml/dataset/generate_dataset.py
    python ml/training/train.py
    ```
    This generates a Gradient Boosting classifier scoring ~77.3% accuracy, exporting `collision_model.pkl` and `scaler.pkl` to `ml/saved_models/`.
3.  Launch the FastAPI server:
    ```bash
    python backend/app/main.py
    ```
    The server initiates at [http://localhost:8000](http://localhost:8000). You can inspect the interactive OpenAPI documentation at [http://localhost:8000/docs](http://localhost:8000/docs).

### 3. Frontend Client Setup

1.  Navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install package dependencies:
    ```bash
    npm install
    ```
3.  Run the Next.js development server:
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your web browser to access the SpaceShield AI interface.

---

## Verification & Tests

To execute the automated unit and physics validation tests:
```bash
python backend/tests/test_api.py
```
Outputs check marks for LEO period formulas, low-risk, and high-risk conjunction classifications.
