@echo off
echo === HUB MASTER Backend Server ===
echo.
echo [1] Stopping existing server if running...
taskkill /F /IM masterhub-backend-new.exe 2>nul
taskkill /F /IM masterhub-backend.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2] Rebuilding server...
go build -o masterhub-backend-new.exe .
IF %ERRORLEVEL% NEQ 0 (
    echo BUILD FAILED! Check errors above.
    pause
    exit /b 1
)

echo [3] Starting server on port 3030...
echo.
echo Access: http://localhost:3030
echo API:    http://localhost:3030/api/health
echo.
masterhub-backend-new.exe
pause
