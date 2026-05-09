# Investor View

This repository contains a React frontend and a Flask backend.

## Structure

- `frontend/` – React application created with Create React App
- `backend/` – Flask API and production server logic

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev          # development server
npm run build      # production build
```

### Backend

```bash
cd backend
python -m venv venv
# on Windows
venv\Scripts\activate
# on Unix
source venv/bin/activate
pip install -r requirements.txt
set FLASK_APP=app.py        # or export FLASK_APP=app.py
set FLASK_ENV=development   # or export FLASK_ENV=development
flask run
```

### Docker and Kubernetes

Use the root deployment script to fetch the latest repo code, build Docker images, and deploy to a local Kubernetes cluster:

```powershell
.\deploy-local.ps1
```

If your backend depends on a locally-built `hcnb_stock_data` repository, pass its path:

```powershell
.\deploy-local.ps1 -LocalHcnbStockDataPath "C:\repos\hcnb-stock-data"
```

This will build the package into a wheel and include it in the backend Docker image.

The frontend will be exposed on `http://localhost:30080` and the backend is available internally through the frontend proxy at `/api`.

### Combined scripts (root)

The root `package.json` provides convenience scripts:

```bash
npm run start:dev     # runs backend and frontend together (requires concurrently)
npm run start:prod    # builds frontend then launches backend with gunicorn
```

For a simpler Windows setup, use the PowerShell script:

```powershell
.\start-dev.ps1
```

This script starts both servers as background jobs in the current terminal. Press Ctrl+C to stop both servers gracefully.