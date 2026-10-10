@echo off
TITLE ORION v2 - Seed Demo Data
echo ========================================================
echo    ORION v2 -- Seeding 14 Multi-Scenario Threat Cases
echo ========================================================
echo.

cd /d "%~dp0\..\backend"

if exist ".venv\Scripts\activate.bat" (
    call .venv\Scripts\activate.bat
)

python scripts/seed_demo_incidents.py
echo.
echo Database seeded successfully at backend\data\orion.db!
pause
