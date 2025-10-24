@echo off
echo ========================================
echo   Pahiy AI - Local Server Baslatiyor
echo ========================================
echo.

REM Virtual environment kontrolu
if not exist "venv\" (
    echo [1/4] Virtual environment olusturuluyor...
    python -m venv venv
    echo ✓ Virtual environment olusturuldu
    echo.
) else (
    echo [1/4] Virtual environment mevcut ✓
    echo.
)

REM Virtual environment'i aktif et
echo [2/4] Virtual environment aktif ediliyor...
call venv\Scripts\activate.bat
echo ✓ Virtual environment aktif
echo.

REM Gerekli paketleri yukle
echo [3/4] Paketler yukleniyor...
pip install -q -r requirements.txt
echo ✓ Paketler yuklendi
echo.

REM API Key kontrolu
if not exist ".env" (
    echo ⚠️  UYARI: .env dosyasi bulunamadi!
    echo Lutfen .env dosyasina Google Gemini API Key'inizi ekleyin.
    echo.
    pause
    exit /b
)

REM Server'i baslat
echo [4/4] Server baslatiliyor...
echo.
echo ========================================
echo   🚀 Pahiy AI Hazir!
echo ========================================
echo.
echo   Ana Sayfa: http://localhost:5000
echo   Chat: http://localhost:5000/chat
echo.
echo   Durdurmak icin: CTRL+C
echo ========================================
echo.

python main.py

pause

