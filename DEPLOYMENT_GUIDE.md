# 🚀 Deployment Guide

## Railway Deployment (ÖNERİLEN - Full Stack)

Railway hem backend hem frontend'i birlikte host eder. En kolay yöntem!

### 1️⃣ Ön Hazırlık

#### Google Gemini API Key Al
1. [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. "Create API Key" butonuna tıkla
3. API key'i kopyala ve sakla

#### Git Kontrolü
```bash
# Git reposunda olduğundan emin ol
git status

# Eğer git yoksa:
git init
git add .
git commit -m "Initial commit - ready for deployment"

# GitHub'a push (opsiyonel ama önerilen)
git remote add origin https://github.com/yourusername/pahiy-ai.git
git branch -M main
git push -u origin main
```

---

## 🚂 Railway Deployment

### Adım 1: Railway'e Kayıt Ol
1. [railway.app](https://railway.app) → "Start a New Project"
2. GitHub ile giriş yap

### Adım 2: Proje Oluştur
1. "Deploy from GitHub repo" seç
2. pahiy-ai repository'ni seç
3. Railway otomatik deployment başlatacak

### Adım 3: Environment Variables Ekle
Dashboard → Variables sekmesine git:

```bash
GENAI_API_KEY=your_actual_google_gemini_key_here
GENAI_MODEL=gemini-1.5-flash
SECRET_KEY=pahiy-ai-production-secret-key-change-this-32chars
ENVIRONMENT=production
PORT=5000
```

**Önemli:** `SECRET_KEY` için güvenli, rastgele 32+ karakter string kullan!

### Adım 4: Deploy URL'i Al
Railway size bir URL verecek, örneğin:
```
https://pahiy-ai-production.up.railway.app
```

### Adım 5: Backend URL'leri Güncelle

#### `frontend/js/script.js` ve `frontend/js/auth.js`:
```javascript
// Lokal test için:
const BACKEND_URL = 'http://localhost:5000';

// Production için değiştir:
const BACKEND_URL = 'https://pahiy-ai-production.up.railway.app';
```

**İki seçenek:**

**Seçenek A: Manuel değiştir** (basit)
- Her iki dosyayı da düzenle
- Commit ve push yap

**Seçenek B: Environment-based** (profesyonel)
```javascript
const BACKEND_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000'
    : window.location.origin;
```

### Adım 6: Push ve Deploy
```bash
git add .
git commit -m "Update backend URL for production"
git push
```

Railway otomatik yeniden deploy edecek!

### Adım 7: Test Et
```bash
# Health check
curl https://your-app.railway.app/api/health

# Browser'da aç
https://your-app.railway.app
```

---

## ⚙️ Railway Yapılandırması

### `Procfile` (Zaten var)
```
web: cd backend && python app.py
```

### `runtime.txt` (Zaten var)
```
python-3.11
```

### `requirements.txt` (Zaten var)
```
Flask==2.3.3
Flask-CORS==4.0.0
google-generativeai==0.8.5
python-dotenv==1.0.0
```

---

## 🎨 Vercel Deployment (Alternatif - Sadece Frontend)

**Not:** Backend yine Railway'de olmalı!

### Adım 1: Vercel'e Kayıt
1. [vercel.com](https://vercel.com)
2. GitHub ile giriş yap

### Adım 2: Proje Import Et
1. "Add New" → "Project"
2. pahiy-ai repository'ni seç
3. **Root Directory:** `frontend` olarak ayarla

### Adım 3: Build Settings
```bash
Framework Preset: Other
Build Command: (boş bırak - statik)
Output Directory: .
```

### Adım 4: Environment Variables
```bash
NEXT_PUBLIC_BACKEND_URL=https://your-railway-backend.railway.app
```

### Adım 5: Deploy
"Deploy" butonuna tıkla!

### ⚠️ Vercel için JS Değişikliği
```javascript
// frontend/js/script.js ve auth.js
const BACKEND_URL = import.meta.env.NEXT_PUBLIC_BACKEND_URL || 'https://your-railway-backend.railway.app';
```

---

## 🔍 Deploy Sonrası Kontroller

### ✅ Checklist:

- [ ] Health endpoint çalışıyor (`/api/health`)
- [ ] Login sayfası açılıyor
- [ ] CSS ve JS yükleniyor
- [ ] Kayıt olabiliyorsun
- [ ] Giriş yapabiliyorsun
- [ ] Chat oluşturabiliyorsun
- [ ] AI yanıt veriyor
- [ ] Şifre değiştirme çalışıyor
- [ ] Mobile responsive
- [ ] Rate limiting çalışıyor (10+ hızlı login dene)

### 🐛 Sorun Giderme

#### "API key not configured"
- Railway Variables'da `GENAI_API_KEY` var mı kontrol et
- Restart deployment

#### "CORS error"
- `backend/app.py`'de CORS origins kontrol et
- Production'da allowed origins doğru mu?

#### "Cannot connect to backend"
- `frontend/js/*.js` dosyalarında BACKEND_URL doğru mu?
- Railway URL kopyala/yapıştır hatası olabilir

#### "502 Bad Gateway"
- Railway logs'u kontrol et
- `backend/app.py` hatasız çalışıyor mu?

---

## 📊 Railway Dashboard

### Deployment Logs Görüntüle:
```
Railway Dashboard → Your Project → Deployments → View Logs
```

### Restart Deployment:
```
Railway Dashboard → Settings → Restart
```

### Custom Domain Ekle:
```
Railway Dashboard → Settings → Domains → Add Domain
```

---

## 🔐 Production Güvenliği

### Zorunlu:
- ✅ HTTPS (Railway otomatik)
- ✅ Environment variables (asla hardcode etme)
- ✅ SECRET_KEY değiştir
- ✅ CORS production domain'e sınırla

### Önerilen:
- [ ] Custom domain kullan
- [ ] Sentry error tracking ekle
- [ ] CloudFlare CDN kullan
- [ ] Regular backups al

---

## 🎯 Deployment Seçenekleri Karşılaştırması

| Özellik | Railway (Full Stack) | Railway + Vercel |
|---------|---------------------|------------------|
| **Kolaylık** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Maliyet** | Ücretsiz (500h/ay) | İkisi de ücretsiz |
| **Hız** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Setup** | 5 dakika | 15 dakika |
| **Maintenance** | Kolay | Orta |

**Öneri:** Railway full-stack kullan! Daha basit ve maintainable.

---

## 📝 Post-Deployment

### Domain Bağlama (Opsiyonel)
```
1. Domain satın al (Namecheap, GoDaddy, vb.)
2. Railway → Settings → Domains → Add Custom Domain
3. DNS ayarlarını güncelle (Railway rehberi var)
4. CORS_ORIGINS environment variable'ına domain'i ekle
```

### SSL Certificate
Railway otomatik Let's Encrypt SSL sağlar. Hiçbir şey yapma!

### Monitoring
```bash
# Railway'de built-in monitoring var
# Dashboard'dan CPU, Memory, Network kullanımını izle
```

---

## 🎉 Başarılı Deploy Sonrası

Proje şurada live olacak:
```
https://your-app-name.up.railway.app
```

Tweet at:
> 🚀 Pahiy AI artık live! Google Gemini entegreli AI chat uygulamam yayında!
> https://your-app.railway.app
> #AI #Python #Flask #WebDev

---

## 📞 Destek

Railway Issues:
- [Railway Discord](https://discord.gg/railway)
- [Railway Docs](https://docs.railway.app)

Proje Issues:
- GitHub Issues

---

**Happy Deploying! 🎊**

**Son Güncelleme:** 2024-10-24

