@echo off
echo ========================================
echo   Pahiy AI - Local Server
echo ========================================
echo.

REM BURAYA KENDI API KEY'INI YAZ!
set GENAI_API_KEY=AIzaSyAqV8zpNrGq_ZWETVNjduaTFyvdbOaidjA

set GENAI_MODEL=gemini-2.5-flash
set SECRET_KEY=pahiy-ai-super-secret-key-2024
set PORT=5000

echo Server baslatiliyor...
echo.
echo ========================================
echo   🚀 Pahiy AI Hazir!
echo ========================================
echo.
echo   Ana Sayfa: http://localhost:5000
echo   Chat: http://localhost:5000/chat
echo   Health: http://localhost:5000/api/health
echo.
echo   Durdurmak icin: CTRL+C
echo ========================================
echo.

cd backend
python app.py

pause

