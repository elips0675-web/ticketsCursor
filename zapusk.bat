@echo off
cd /d "%~dp0"
title Service Desk

echo ==============================
echo   Service Desk - Launch
echo ==============================
echo.
echo Folder: %CD%
echo.

where node >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [ERROR] Node.js not found
    pause
    exit /b
)

if not exist "server\.env" copy "server\.env.example" "server\.env" >nul
if not exist "node_modules" call npm install
if not exist "server\node_modules" (
    cd server
    call npm install
    cd ..
)

taskkill /f /im node.exe >nul 2>&1

start "SD-API" /min cmd /c "cd /d %~dp0server && npm run dev"
start "SD-Front" /min cmd /c "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo ==============================
echo   Running!
echo   Frontend: http://localhost:5173
echo   API:      http://localhost:4000
echo ==============================
echo.
pause >nul

taskkill /f /fi "WINDOWTITLE eq SD-API*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq SD-Front*" >nul 2>&1
echo Done.
