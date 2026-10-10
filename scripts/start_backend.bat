@echo off
TITLE ORION v2 - Backend Server (FastAPI)
echo ========================================================
echo    ORION v2 -- AI Threat Intelligence Platform
echo    Starting FastAPI Backend Engine on Port 8000...
echo ========================================================
echo.

cd /d "%~dp0\..\backend"

if exist ".venv\Scripts\activate.bat" (
    echo Activating Python virtual environment...
    call .venv\Scripts\activate.bat
)

echo Checking dependencies...
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
pause
