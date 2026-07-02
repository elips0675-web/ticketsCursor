@echo off
cd /d "%~dp0"

echo ===== Service Desk - Запуск =====
echo.
echo 1. Установка зависимостей...
call npm install
cd server
call npm install
cd ..

echo.
echo 2. Запуск сервера (API :4000)...
start "Service Desk API" cmd /c "cd /d %~dp0server && npm run dev"

echo.
echo 3. Запуск фронтенда (:5173)...
start "Service Desk Frontend" cmd /c "cd /d %~dp0 && npm run dev"

echo.
echo ===== Запущено =====
echo Frontend: http://localhost:5173
echo API:      http://localhost:4000
echo.
echo Закройте окна чтобы остановить.
pause
