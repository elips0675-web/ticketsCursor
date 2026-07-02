@echo off
chcp 65001 >nul
cd /d "%~dp0"

title Service Desk — Laragon
color 0b

echo ========================================
echo    Service Desk — Zapusk
echo ========================================
echo.
echo Papka: %CD%
echo.

where node >nul 2>&1
if %errorlevel% NEQ 0 (
    echo [!] Node.js ne naiden
    pause & exit /b
)

if not exist "server\.env" (
    copy "server\.env.example" "server\.env" >nul
)
if not exist "node_modules" call npm install
if not exist "server\node_modules" (
    cd server
    call npm install
    cd ..
)

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

start "SD API" /min cmd /c "cd /d %~dp0server && npm run dev"
start "SD Frontend" /min cmd /c "cd /d %~dp0 && npm run dev"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo    Zapusheno!
echo    Frontend: http://localhost:5173
echo    API:      http://localhost:4000
echo ========================================
echo.
pause >nul

taskkill /f /fi "WINDOWTITLE eq SD API*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq SD Frontend*" >nul 2>&1
echo Gotovo.
