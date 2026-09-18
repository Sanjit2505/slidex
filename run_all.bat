@echo off
echo Starting SlideX Backend and Frontend...
start "SlideX Backend" cmd /k "cd /d %~dp0 && .\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"
start "SlideX Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both servers started! Frontend available at http://localhost:5173
