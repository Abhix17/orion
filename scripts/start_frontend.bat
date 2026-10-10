@echo off
TITLE ORION v2 - Frontend Command Center (React + Vite)
echo ========================================================
echo    ORION v2 -- SOC Dashboard & Citizen Portal
echo    Starting Vite Dev Server on Port 5173...
echo ========================================================
echo.

cd /d "%~dp0\..\frontend"

npm run dev
pause
