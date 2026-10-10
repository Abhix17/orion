@echo off
TITLE ORION v2 - Mobile Application (Expo / React Native)
echo ========================================================
echo    ORION v2 -- Citizen Safety Mobile App
echo    Starting Expo Mobile Dev Server...
echo ========================================================
echo.

cd /d "%~dp0\..\mobile"

npx expo start
pause
