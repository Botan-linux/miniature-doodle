@echo off
chcp 65001 >nul
title Agent Hub

echo ═══════════════════════════════════════════════════════════
echo.                                                           
echo    🎖️  AGENT HUB BAŞLATILIYOR...                           
echo.                                                           
echo ═══════════════════════════════════════════════════════════

cd /d "%~dp0"
set ROOT_DIR=%cd%

echo [1/4] Bağımlılıklar kontrol ediliyor...

:: Bun kontrolü
where bun >nul 2>&1
if %errorlevel% neq 0 (
    echo Bun bulunamadı! Lütfen https://bun.sh adresinden yükleyin.
    pause
    exit /b 1
)

echo [2/4] Chat Service başlatılıyor (Port 3003)...
cd "%ROOT_DIR%\chat-service"
start "Chat Service" cmd /k bun run index.ts

timeout /t 3 /nobreak >nul

echo [3/4] Web uygulaması başlatılıyor (Port 3000)...
cd "%ROOT_DIR%\app"
start "Web App" cmd /k bun run dev

timeout /t 5 /nobreak >nul

echo.
echo ✅ Agent Hub çalışıyor!
echo.
echo    🌐 Web Arayüzü: http://localhost:3000
echo    🔌 WebSocket:   ws://localhost:3003
echo.
echo    📋 Agent CLI için yeni terminal açın:
echo       cd %ROOT_DIR%
echo       bun run agent-cli.ts --name="AgentAdı"
echo.
echo    Durdurmak için açılan pencereleri kapatın.
echo.

:: Tarayıcıyı aç
start http://localhost:3000

pause
