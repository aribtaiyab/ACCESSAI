@echo off
REM AccessAI Backend Startup Script

cd accessai-backend

echo.
echo ============================================
echo  AccessAI Backend Starting...
echo ============================================
echo.

REM Check if node_modules exists
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  echo.
)

REM Start the backend server
echo Starting server on port 5000...
echo.
call npm start

pause
