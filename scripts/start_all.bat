@echo off
TITLE ORION v2 - Master Launcher
echo ========================================================
echo    ORION v2: AI Threat Intelligence Platform
echo    BPUT Hackathon PS09: CYBERGUARD
echo ========================================================
echo.
echo Launching Backend Server (FastAPI on http://localhost:8000)...
start "ORION Backend (Port 8000)" "%~dp0start_backend.bat"

ping 127.0.0.1 -n 3 >nul

echo Launching Frontend Dashboard (Vite on http://localhost:5173)...
start "ORION Frontend (Port 5173)" "%~dp0start_frontend.bat"

ping 127.0.0.1 -n 4 >nul

echo Opening ORION Citizen Portal ^& SOC Command Center in default browser...
start http://localhost:5173

echo.
echo ========================================================
echo    ORION v2 is now running!
echo    - Citizen Safety Portal: http://localhost:5173
echo    - SOC Command Center:   http://localhost:5173 (Click 'SOC Command Center' toggle)
echo    - Interactive API Docs: http://localhost:8000/docs
echo    - Mobile App (Expo):    Run scripts\start_mobile.bat
echo ========================================================
echo.
