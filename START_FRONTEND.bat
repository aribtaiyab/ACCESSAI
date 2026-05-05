@echo off
REM AccessAI Frontend Startup Script

cd accessai-frontend

echo.
echo ============================================
echo  AccessAI Frontend Starting...
echo ============================================
echo.

REM Check if node_modules exists
if not exist node_modules (
  echo Installing dependencies...
  call npm install
  echo.
)

REM Start the frontend development server
echo Starting frontend on port 3000...
echo.
call npm run dev

pause
