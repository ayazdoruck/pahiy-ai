# 📁 Proje Yapısı

```
pahiy-ai/
│
├── backend/                    # Backend (Python/Flask)
│   ├── __init__.py            # Python package marker
│   ├── app.py                 # Ana Flask uygulaması (eski main.py)
│   ├── database.py            # SQLite veritabanı yönetimi
│   ├── security_utils.py      # Güvenlik fonksiyonları
│   └── config.py              # Konfigürasyon ayarları
│
├── frontend/                   # Frontend (HTML/CSS/JS)
│   ├── index.html             # Ana chat sayfası
│   ├── login.html             # Giriş/Kayıt sayfası
│   │
│   ├── css/                   # Stil dosyaları
│   │   ├── style.css          # Ana sayfa stilleri
│   │   └── login.css          # Login sayfası stilleri
│   │
│   └── js/                    # JavaScript dosyaları
│       ├── script.js          # Ana sayfa JavaScript
│       └── auth.js            # Authentication JavaScript
│
├── docs/                       # Dokümantasyon
│   ├── SECURITY.md            # Güvenlik bilgileri
│   └── PRODUCTION_CHECKLIST.md # Production checklist
│
├── .gitignore                  # Git ignore kuralları
├── Procfile                    # Railway/Heroku deployment
├── README.md                   # Proje dokümantasyonu
├── requirements.txt            # Python bağımlılıkları
├── runtime.txt                 # Python versiyonu
├── start.bat                   # Windows başlatma scripti
├── start_local.bat             # Local development script
├── start_local.sh              # Unix/Linux başlatma scripti
└── PROJECT_STRUCTURE.md        # Bu dosya
```

## 📂 Klasör Açıklamaları

### `/backend`
Python Flask backend kodu. Tüm server-side logic burada.

**Dosyalar:**
- `app.py`: Ana Flask uygulaması, route'lar, API endpoints
- `database.py`: SQLite veritabanı işlemleri (CRUD)
- `security_utils.py`: Rate limiting, input sanitization, validation
- `config.py`: Environment variables ve konfigürasyon

### `/frontend`
Statik HTML/CSS/JavaScript dosyaları. Client-side kod.

**Alt Klasörler:**
- `css/`: Tüm stil dosyaları
- `js/`: Tüm JavaScript dosyaları

### `/docs`
Proje dokümantasyonu ve guidel ar.

## 🔄 Path Yapısı

### Backend Route'ları:
```python
/                   → frontend/login.html
/chat              → frontend/index.html
/css/<filename>    → frontend/css/<filename>
/js/<filename>     → frontend/js/<filename>
```

### HTML'de Asset Yükleme:
```html
<!-- CSS -->
<link rel="stylesheet" href="/css/style.css">

<!-- JavaScript -->
<script src="/js/script.js"></script>
```

## 🚀 Çalıştırma

### Development (Local):
```bash
# Windows
start.bat

# Unix/Linux
./start_local.sh
```

### Production (Railway/Heroku):
```bash
# Procfile kullanılır:
cd backend && python app.py
```

## 📦 Yeni Dosya Ekleme Kuralları

### Backend Python Dosyası:
```
backend/new_module.py
```

### Frontend CSS:
```
frontend/css/new_style.css
```

### Frontend JavaScript:
```
frontend/js/new_script.js
```

### Dokümantasyon:
```
docs/NEW_DOC.md
```

## 🎯 Best Practices

1. **Backend kodu** sadece `backend/` klasöründe
2. **Frontend kodu** sadece `frontend/` klasöründe
3. **Dokümantasyon** `docs/` klasöründe
4. **Config dosyaları** root'ta (requirements.txt, .gitignore, vb.)
5. **Database dosyası** root'ta (git ignore'da)

## 🔒 Güvenlik

- `.env` dosyası root'ta (`.gitignore`'da)
- `pahiy_ai.db` root'ta (`.gitignore`'da)
- API keys asla commit edilmemeli
- Sensitive data `/backend` dışında değil

## 📝 Notlar

- Proje yapısı **modüler** ve **scalable**
- Her klasörün tek bir sorumluluğu var (SRP)
- Path'ler **absolute** (`/css/style.css`) kullanıyor
- Development ve production ayarları ayrı (`config.py`)

---

**Son Güncelleme:** 2024-10-24
**Versiyon:** 2.0 (Restructured)

