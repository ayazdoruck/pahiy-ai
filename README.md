# 🤖 Pahiy AI - Intelligent Chat Assistant

> **Made by @ayazdoruck**

Modern, güvenli ve kullanıcı dostu AI sohbet uygulaması. Google Gemini AI entegrasyonlu, hesap sistemi ve chat geçmişi yönetimi ile.

## ✨ Özellikler

### 🔐 Kullanıcı Yönetimi
- Ad, Soyad, Kullanıcı Adı ile kayıt
- Email veya Kullanıcı Adı ile giriş
- Şifre göster/gizle özelliği
- Şifre değiştirme
- Güvenli token-based authentication

### 💬 Chat Sistemi
- Sınırsız sohbet oluşturma
- Her sohbet için konuşma geçmişi
- Otomatik chat başlık oluşturma
- Kaldığı yerden devam etme
- Chat silme

### 🎨 Arayüz
- ChatGPT benzeri modern tasarım
- Sidebar ile chat yönetimi
- Animasyonlu sidebar (mobile)
- Kod blokları ve syntax highlighting
- Kod kopyalama özelliği
- Full mobile responsive

### 🔒 Güvenlik
- Rate limiting (DDoS koruması)
- Input sanitization (XSS koruması)
- SQL injection koruması
- Security headers
- Güvenlik logları

## 📁 Proje Yapısı

```
pahiy-ai/
├── backend/              # Python Flask backend
│   ├── app.py           # Ana uygulama
│   ├── database.py      # Veritabanı işlemleri
│   ├── security_utils.py # Güvenlik fonksiyonları
│   └── config.py        # Konfigürasyon
│
├── frontend/            # HTML/CSS/JS
│   ├── index.html       # Chat sayfası
│   ├── login.html       # Giriş sayfası
│   ├── css/            # Stil dosyaları
│   └── js/             # JavaScript dosyaları
│
├── docs/               # Dokümantasyon
│   ├── SECURITY.md
│   └── PRODUCTION_CHECKLIST.md
│
└── [config files]      # requirements.txt, Procfile, vb.
```

Detaylı yapı için: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

## 🚀 Kurulum

### 1. Gereksinimler
```bash
Python 3.11+
pip
```

### 2. Bağımlılıkları Yükle
```bash
pip install -r requirements.txt
```

### 3. Environment Variables
```bash
# .env dosyası oluştur (root'ta)
GENAI_API_KEY=your_google_gemini_api_key
GENAI_MODEL=gemini-1.5-flash
SECRET_KEY=your_secret_key
ENVIRONMENT=development
```

### 4. Başlat
```bash
# Windows
start.bat

# Unix/Linux
./start_local.sh

# Manuel
cd backend
python app.py
```

## 🌐 Deployment

### Railway
```bash
1. Railway.app'e git
2. Deploy from GitHub repo
3. Environment variables ekle:
   - GENAI_API_KEY
   - GENAI_MODEL
   - SECRET_KEY
   - ENVIRONMENT=production
   - CORS_ORIGINS=https://your-domain.com
4. Deploy!
```

Detaylı guide: [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md)

## 🔐 Güvenlik

- ✅ SQL Injection koruması
- ✅ XSS koruması
- ✅ Rate limiting
- ✅ Input validation
- ✅ HTTPS (production)
- ✅ Security headers
- ✅ Audit logs

Detaylar: [docs/SECURITY.md](docs/SECURITY.md)

## 🛠️ Teknolojiler

**Backend:**
- Flask 2.3.3
- SQLite3
- Google Generative AI
- Python 3.11

**Frontend:**
- Vanilla JavaScript
- HTML5/CSS3
- Font Awesome
- Google Fonts

## 📖 API Dokümantasyonu

### Authentication
```
POST /api/register  - Yeni kullanıcı kaydı
POST /api/login     - Giriş
POST /api/logout    - Çıkış
GET  /api/me        - Kullanıcı bilgisi
POST /api/change-password - Şifre değiştir
```

### Chat Management
```
GET    /api/chats           - Tüm chatler
POST   /api/chats           - Yeni chat
GET    /api/chats/<id>      - Chat detay
DELETE /api/chats/<id>      - Chat sil
PUT    /api/chats/<id>/title - Başlık güncelle
```

### Messaging
```
POST /api/chat              - Mesaj gönder
POST /api/chats/<id>/clear  - Chat temizle
```

## 🧪 Test

```bash
# Local test
cd backend
python app.py

# Browser'da test
http://localhost:5000

# Test kullanıcısı oluştur
Kayıt Ol → Test hesabı oluştur → Chat yap
```

## 📝 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 👨‍💻 Geliştirici

**Ayaz Doruk Şenel** - [@ayazdoruck](https://github.com/ayazdoruck)

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing`)
5. Pull Request açın

## 📞 Destek

Sorunlar için [GitHub Issues](https://github.com/yourusername/pahiy-ai/issues) açın.

---

⭐ Beğendiyseniz yıldız vermeyi unutmayın!

**Versiyon:** 2.0  
**Son Güncelleme:** 2024-10-24
