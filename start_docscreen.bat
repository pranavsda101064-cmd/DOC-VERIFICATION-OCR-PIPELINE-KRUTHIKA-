@echo off
title DocScreen - Unified Launcher
color 0B
echo ========================================================
echo        DocScreen AI Document Verification System
echo ========================================================
echo.

:: Step 1: Start Backend
if exist "%~dp0backend\venv\Scripts\uvicorn.exe" (
    echo [1/3] Launching FastAPI Backend on http://localhost:8000 ...
    start "DocScreen - Backend API" cmd /k "title DocScreen Backend && cd /d ""%~dp0backend"" && venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"
) else if exist "%~dp0backend\.venv\Scripts\uvicorn.exe" (
    echo [1/3] Launching FastAPI Backend on http://localhost:8000 ...
    start "DocScreen - Backend API" cmd /k "title DocScreen Backend && cd /d ""%~dp0backend"" && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"
) else (
    echo [ERROR] Backend virtual environment not found in backend\venv!
    pause
    exit /b 1
)

:: Step 2: Start Frontend
echo [2/3] Launching Next.js Frontend on http://localhost:3000 ...
start "DocScreen - Frontend UI" cmd /k "title DocScreen Frontend && cd /d ""%~dp0frontend"" && npm run dev"

:: Step 3: Wait for servers to spin up
echo [3/3] Waiting 6 seconds for servers to initialize...
ping 127.0.0.1 -n 7 >nul

:: Step 4: Open in Zen Browser if installed, otherwise default browser
echo.
if exist "C:\Program Files\Zen Browser\zen.exe" (
    echo [OK] Opening in Zen Browser...
    start "" "C:\Program Files\Zen Browser\zen.exe" "http://localhost:3000"
) else if exist "%LOCALAPPDATA%\Zen\zen.exe" (
    echo [OK] Opening in Zen Browser...
    start "" "%LOCALAPPDATA%\Zen\zen.exe" "http://localhost:3000"
) else (
    echo [OK] Opening in default browser...
    start "" "http://localhost:3000"
)

echo.
echo ========================================================
echo   DocScreen is LIVE!
echo   Frontend UI : http://localhost:3000
echo   Backend Docs: http://localhost:8000/docs
echo ========================================================
echo   (Keep the 2 terminal windows open while using the app)
echo.
