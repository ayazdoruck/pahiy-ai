#!/bin/bash

echo "========================================"
echo "  Pahiy AI - Local Server Başlatıyor"
echo "========================================"
echo ""

# Virtual environment kontrolü
if [ ! -d "venv" ]; then
    echo "[1/4] Virtual environment oluşturuluyor..."
    python3 -m venv venv
    echo "✓ Virtual environment oluşturuldu"
    echo ""
else
    echo "[1/4] Virtual environment mevcut ✓"
    echo ""
fi

# Virtual environment'i aktif et
echo "[2/4] Virtual environment aktif ediliyor..."
source venv/bin/activate
echo "✓ Virtual environment aktif"
echo ""

# Gerekli paketleri yükle
echo "[3/4] Paketler yükleniyor..."
pip install -q -r requirements.txt
echo "✓ Paketler yüklendi"
echo ""

# API Key kontrolü
if [ ! -f ".env" ]; then
    echo "⚠️  UYARI: .env dosyası bulunamadı!"
    echo "Lütfen .env dosyasına Google Gemini API Key'inizi ekleyin."
    echo ""
    exit 1
fi

# Server'i başlat
echo "[4/4] Server başlatılıyor..."
echo ""
echo "========================================"
echo "  🚀 Pahiy AI Hazır!"
echo "========================================"
echo ""
echo "  Ana Sayfa: http://localhost:5000"
echo "  Chat: http://localhost:5000/chat"
echo ""
echo "  Durdurmak için: CTRL+C"
echo "========================================"
echo ""

python main.py

