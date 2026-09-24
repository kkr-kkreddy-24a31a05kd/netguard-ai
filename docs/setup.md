# NetGuard AI — Setup Guide

## Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **PostgreSQL 14+** (Phase 2+)

---

## 1. Backend Setup

```bash
cd backend
# Create virtual environment
python -m venv .venv
# Activate virtual environment (Windows PowerShell)
.venv\Scripts\Activate.ps1
# (or cmd: .venv\Scripts\activate.bat)

# Install dependencies
pip install -r requirements.txt

# Copy environment template
copy .env.example .env

# Run FastAPI backend
uvicorn app.main:app --reload --port 8000
```
Backend Swagger Documentation: `http://localhost:8000/docs`
Health Check: `http://localhost:8000/health`

---

## 2. Frontend Setup

```bash
cd frontend
# Install dependencies
npm install

# Copy environment template
copy .env.example .env

# Run development server
npm run dev
```
Frontend Web Application: `http://localhost:5173`
Design System Showcase: `http://localhost:5173/design`
