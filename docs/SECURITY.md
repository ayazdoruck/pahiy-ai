# 🔒 Güvenlik Önlemleri

## Projeyi Public Yapmadan Önce Kontrol Listesi

### ✅ Yapılması Gerekenler:

#### 1. Environment Variables
- [ ] `.env` dosyası `.gitignore`'da
- [ ] API key'leri asla commit etme
- [ ] Production'da farklı SECRET_KEY kullan
- [ ] `.env.example` dosyası oluştur (örnek değerlerle)

#### 2. Database Güvenliği
- [ ] Production'da SQLite yerine PostgreSQL kullan
- [ ] Veritabanı dosyası `.gitignore`'da
- [ ] Düzenli backup al
- [ ] Sensitive data'yı encrypt et

#### 3. API Güvenliği
- [ ] Rate limiting ekle
- [ ] CORS ayarlarını production domain'e göre sınırla
- [ ] Input validation her yerde
- [ ] SQL injection koruması (✅ parameterized queries kullanılıyor)
- [ ] XSS koruması (✅ HTML escape kullanılıyor)

#### 4. Authentication
- [ ] Şifreleri hash'le (✅ SHA-256 kullanılıyor)
- [ ] Session token'ları güvenli oluştur (✅ secrets.token_urlsafe kullanılıyor)
- [ ] Token expiration süresi ayarla (✅ 30 gün)
- [ ] HTTPS kullan (production'da zorunlu)

#### 5. Error Handling
- [ ] Detaylı hata mesajlarını production'da gösterme
- [ ] Log dosyalarını sakla
- [ ] Sentry/error tracking ekle

### ⚠️ Production'da Değiştirilmesi Gerekenler:

```python
# main.py
# Development:
app.run(debug=True)

# Production:
app.run(debug=False)
```

```python
# CORS - Development:
CORS(app, supports_credentials=True, origins=["*"])

# CORS - Production:
allowed_origins = os.environ.get('CORS_ORIGINS', '').split(',')
CORS(app, supports_credentials=True, origins=allowed_origins)
```

### 🛡️ Güvenlik Best Practices:

1. **Asla Commit Etme:**
   - API keys
   - Şifreler
   - Database dosyaları
   - Session secrets
   - Private keys

2. **Her Zaman Validate Et:**
   - User input
   - File uploads
   - API responses

3. **HTTPS Kullan:**
   - Production'da zorunlu
   - Railway otomatik sağlıyor

4. **Rate Limiting:**
   - API endpoint'lerine limit koy
   - Brute force saldırıları engelle

5. **Monitoring:**
   - Error tracking
   - Performance monitoring
   - Security logs

### 📝 Güncellemeler:

#### Yapıldı:
- ✅ SQL injection koruması (parameterized queries)
- ✅ XSS koruması (HTML escape)
- ✅ Şifre hash'leme (SHA-256)
- ✅ Secure token generation
- ✅ Input validation (frontend + backend)
- ✅ Session management

#### Yapılacak:
- [ ] Rate limiting ekle
- [ ] HTTPS redirect
- [ ] CSRF protection
- [ ] Helmet.js benzeri güvenlik headers
- [ ] Audit logs

### 🚨 Acil Durum:

Eğer API key expose olduysa:
1. Hemen Google AI Studio'dan key'i revoke et
2. Yeni key oluştur
3. Environment variable'ı güncelle
4. Tüm active session'ları invalid et

### 📞 Güvenlik Sorunları:

Güvenlik açığı bulursanız lütfen public issue açmayın.
Direkt email: security@yourdomain.com

---

**Son Güncelleme:** 2024-10-24

