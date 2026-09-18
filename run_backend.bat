@echo off
echo Starting SlideX FastAPI Backend Server...
cd /d "%~dp0"
.\venv\Scripts\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
pause
