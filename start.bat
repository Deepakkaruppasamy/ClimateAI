@echo off
echo ==========================================
echo   ClimateAI - Setup ^& Launch Script
echo ==========================================
echo.

echo [1/3] Installing client dependencies...
cd /d "%~dp0client"
call npm install
if errorlevel 1 (
  echo ERROR: Client install failed
  pause
  exit /b 1
)

echo.
echo [2/3] Installing server dependencies...
cd /d "%~dp0server"
call npm install
if errorlevel 1 (
  echo ERROR: Server install failed
  pause
  exit /b 1
)

echo.
echo [3/3] Starting development servers...
echo.
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:5000
echo.
echo Press Ctrl+C in each window to stop.
echo.

start "ClimateAI Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 3 /nobreak >nul
start "ClimateAI Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo Both servers starting. Your browser should open automatically.
pause
