# 🚀 Production Hazırlık Checklist

## ☑️ Deploy Öncesi Kontroller

### 1. **Environment Variables** 🔑
- [ ] `.env` dosyası `.gitignore`'da
- [ ] Google Gemini API key aktif ve çalışıyor
- [ ] SECRET_KEY güçlü ve rastgele (en az 32 karakter)
- [ ] ENVIRONMENT="production" ayarlandı
- [ ] CORS_ORIGINS production domain'ini içeriyor
- [ ] `.env.example` dosyası oluşturuldu

### 2. **Güvenlik** 🔒
- [ ] Rate limiting aktif
- [ ] Input sanitization çalışıyor
- [ ] SQL injection koruması var (parameterized queries)
- [ ] XSS koruması var (HTML escape)
- [ ] CSRF protection (opsiyonel)
- [ ] Security headers eklendi
- [ ] HTTPS aktif (Railway otomatik sağlıyor)

### 3. **Database** 💾
- [ ] Veritabanı dosyası `.gitignore`'da
- [ ] Backup stratejisi var mı?
- [ ] Production'da PostgreSQL kullanmayı düşün (SQLite yerine)

### 4. **Code Quality** 💻
- [ ] Debug mode kapalı (`debug=False`)
- [ ] Gereksiz print/console.log'lar kaldırıldı
- [ ] Error handling her yerde var
- [ ] Logging düzgün çalışıyor

### 5. **Frontend** 🎨
- [ ] Backend URL production'a göre güncellendi
- [ ] `script.js` ve `auth.js`'de BACKEND_URL doğru
- [ ] Mobile responsive test edildi
- [ ] Farklı browser'larda test edildi

### 6. **Documentation** 📚
- [ ] README.md güncel
- [ ] SECURITY.md var
- [ ] API documentation var mı?
- [ ] Deployment guide var

### 7. **Testing** 🧪
- [ ] Kayıt/Giriş test edildi
- [ ] Chat fonksiyonları test edildi
- [ ] Şifre değiştirme test edildi
- [ ] Rate limiting test edildi
- [ ] Mobile görünüm test edildi

### 8. **Performance** ⚡
- [ ] Database query'leri optimize
- [ ] Static file'lar CDN'den servis edilebilir
- [ ] Image optimization yapıldı mı?
- [ ] Caching stratejisi var mı?

### 9. **Monitoring** 📊
- [ ] Error tracking (Sentry vs.)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### 10. **Legal** ⚖️
- [ ] Privacy Policy
- [ ] Terms of Service
- [ ] Cookie Policy (GDPR)
- [ ] User data handling policies

---

## 🔥 Deploy Adımları

### Railway Deploy:

```bash
# 1. Git kontrolü
git status
git add .
git commit -m "Production ready"

# 2. Remote check
git remote -v

# 3. Push
git push origin main

# 4. Railway'de variables set et
GENAI_API_KEY=your_key
GENAI_MODEL=gemini-1.5-flash
SECRET_KEY=your_secret_key
ENVIRONMENT=production
CORS_ORIGINS=https://your-domain.com
```

### Post-Deploy:

```bash
# 1. Health check
curl https://your-app.railway.app/api/health

# 2. Test kayıt
# Browser'da test et

# 3. Logs kontrol
# Railway dashboard'dan logs'u izle
```

---

## ⚠️ Önemli Notlar

### Güvenlik:
- API key'i asla commit etme
- Production'da debug=False olmalı
- HTTPS kullan (Railway otomatik)
- Regular security updates yap

### Database:
- SQLite küçük projeler için OK
- Büyürse PostgreSQL'e geç
- Regular backup al
- Sensitive data encrypt et

### Monitoring:
- Error'ları track et
- Performance metrics izle
- User activity logla
- Security events kaydet

### Backup:
```bash
# Database backup
cp pahiy_ai.db backups/pahiy_ai_$(date +%Y%m%d).db

# Otomatik backup script'i yaz
```

---

## 🎯 Production Öncesi Son Kontrol

```python
# main.py - Bu satırları kontrol et:

# ✅ Debug kapalı
app.run(debug=False)

# ✅ CORS production domain
CORS(app, origins=['https://your-domain.com'])

# ✅ Security headers
@app.after_request
def set_security_headers(response):
    # ...headers...
    return response

# ✅ Rate limiting
@rate_limit(max_requests=10, time_window=60)

# ✅ Input sanitization
user_message = sanitize_input(data['message'])
```

```javascript
// script.js ve auth.js - URL kontrol:

// ✅ Production URL
const BACKEND_URL = 'https://your-app.railway.app';

// ❌ Development URL kaldır
// const BACKEND_URL = 'http://localhost:5000';
```

---

## 📈 Launch Sonrası

### İlk 24 Saat:
- [ ] Error rate izle
- [ ] Response time kontrol et
- [ ] User feedback topla
- [ ] Logs düzenli kontrol et

### İlk Hafta:
- [ ] Performance metrics analiz et
- [ ] Security logs gözden geçir
- [ ] User behavior analiz et
- [ ] Bug reports'ları topla

### Uzun Vadeli:
- [ ] Regular security updates
- [ ] Database optimization
- [ ] Feature improvements
- [ ] User feedback implementation

---

**Good Luck! 🚀**

