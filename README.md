# DiaPredict

DiaPredict is an educational symptom-based risk-screening web application.

The application allows users to enter age, gender, and 14 symptom responses to receive an educational positive/negative diabetes risk screening assessment powered by a machine learning model trained on empirical clinical questionnaire data.

## Tech Stack

- **Frontend**: React, Vite, TypeScript
- **Backend**: Python 3.14, FastAPI, Uvicorn
- **Machine Learning & Data**: pandas, NumPy, scikit-learn, joblib
- **Database**: MongoDB Community Server, PyMongo
- **Testing**: pytest, httpx (backend); Vitest, React Testing Library (frontend)

## Project Structure

```text
diapredict/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── __init__.py
│   │   └── main.py
│   ├── ml/
│   │   └── saved_model/
│   ├── tests/
│   │   └── test_main.py
│   ├── .env.example
│   └── requirements.txt
├── data/
│   └── diabetes_data_upload.csv
├── .gitignore
└── README.md
```

## Getting Started

### 1. Dataset

Ensure `diabetes_data_upload.csv` is placed in the `data/` folder:
```text
data/diabetes_data_upload.csv
```

### 2. Backend Setup

#### Windows PowerShell:
```powershell
cd backend
py -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

#### Git Bash:
```bash
cd backend
python -m venv venv
source venv/Scripts/activate
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

#### Run Backend Server:
```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Swagger API documentation will be available at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```
The frontend development server will be available at [http://localhost:5173](http://localhost:5173).

### 4. Database Setup (MongoDB)

DiaPredict uses local MongoDB Community Server.
- To check service status on Windows:
  ```powershell
  Get-Service -Name MongoDB
  ```
- To start MongoDB service (Administrator PowerShell):
  ```powershell
  Start-Service -Name MongoDB
  ```
  Or run `mongod` directly:
  ```powershell
  & "F:\Software\Mongodb\bin\mongod.exe" --dbpath "F:\Software\Mongodb\data"
  ```
