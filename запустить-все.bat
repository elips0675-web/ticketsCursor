@echo off
chcp 65001 >nul
cd /d "%~dp0"

title Service Desk - Laragon

echo ========================================
echo    Service Desk — Запуск на Laragon
echo ========================================
echo.
echo Папка проекта: %CD%
echo.

:: Проверка node
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js не найден. Установите Node.js
    pause
    exit /b
)

:: Установка зависимостей если нет
if not exist "node_modules" (
    echo [1/3] Установка зависимостей фронтенда...
    call npm install
) else (
    echo [1/3] Зависимости фронтенда есть.
)
if not exist "server\node_modules" (
    echo [2/3] Установка зависимостей сервера...
    cd server
    call npm install
    cd ..
) else (
    echo [2/3] Зависимости сервера есть.
)

:: Проверка .env
if not exist "server\.env" (
    echo [*] server\.env не найден, копирую из .env.example...
    copy "server\.env.example" "server\.env" >nul
)

:: Kill старых процессов на портах
echo [3/3] Запуск серверов...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :4000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

:: Запуск в новых окнах
start "SD API" /min cmd /c "cd /d %CD%\server && npm run dev"
start "SD Frontend" /min cmd /c "cd /d %CD% && npm run dev"

:: Открыть браузер
timeout /t 3 /nobreak >nul
start http://localhost:5173

echo.
echo ========================================
echo    Запущено!
echo    Frontend: http://localhost:5173
echo    API:      http://localhost:4000
echo    MySQL:    localhost:3306 (через Laragon)
echo ========================================
echo.
echo Нажмите любую клавишу чтобы остановить...
pause >nul

:: Остановка
echo Остановка...
taskkill /f /fi "WINDOWTITLE eq SD API*" >nul 2>&1
taskkill /f /fi "WINDOWTITLE eq SD Frontend*" >nul 2>&1
echo Готово.
