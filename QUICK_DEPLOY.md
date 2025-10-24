# ⚡ Hızlı Deploy Rehberi

Projeyi 5 dakikada Railway'e deploy et!

## 🎯 Adım Adım

### 1. API Key Al (2 dakika)
```
https://makersuite.google.com/app/apikey
→ Create API Key
→ Kopyala
```

### 2. Railway'e Git (1 dakika)
```
https://railway.app
→ Start a New Project
→ Deploy from GitHub repo
→ pahiy-ai repository'ni seç
```

### 3. Environment Variables Ekle (2 dakika)
Railway Dashboard → Variables:

```bash
GENAI_API_KEY=paste_your_key_here
GENAI_MODEL=gemini-1.5-flash
SECRET_KEY=change-this-to-random-32-chars
ENVIRONMENT=production
```

### 4. Deploy! ✅
Railway otomatik deploy edecek. URL alacaksın:
```
https://pahiy-ai-production.up.railway.app
```

### 5. Test Et
```
1. Browser'da URL'i aç
2. Kayıt ol
3. Chat yap
4. Çalışıyor! 🎉
```

---

## 🔄 Güncellemeler İçin

```bash
# Code değiştir
git add .
git commit -m "Update"
git push

# Railway otomatik yeniden deploy eder!
```

---

## 🆘 Sorun mu Var?

### API Key çalışmıyor
```
Railway → Variables → GENAI_API_KEY kontrol et
Railway → Deployments → Restart
```

### CSS yüklenmiyor
```
Browser cache temizle (Ctrl+Shift+R)
```

### Chat çalışmıyor
```
Railway → Deployments → View Logs
Hatayı oku ve düzelt
```

---

## 📊 Ücretsiz Limitler

Railway Free Tier:
- ✅ 500 saat/ay server time
- ✅ Unlimited deployments
- ✅ Otomatik SSL
- ✅ Custom domains

Google Gemini Free:
- ✅ 60 request/dakika
- ✅ 1500 request/gün

**Yeterli mi?** Küçük-orta projeler için bol bol! 🎉

---

## ✨ Bonus: Custom Domain

```
1. Domain satın al (Namecheap $10/yıl)
2. Railway → Settings → Domains
3. Add Custom Domain
4. DNS ayarlarını güncelle
5. HTTPS otomatik aktif olacak!
```

---

**Başarılar! 🚀**

