// Backend URL - config.js'den gelecek
const getBackendURL = () => window.CONFIG?.BACKEND_URL || 'http://localhost:5000';

// Success ve Error mesajları
function showSuccess(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.background = 'rgba(16, 185, 129, 0.1)';
        errorDiv.style.borderColor = '#10b981';
        errorDiv.style.color = '#10b981';
    }
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.background = 'rgba(239, 68, 68, 0.1)';
        errorDiv.style.borderColor = '#ef4444';
        errorDiv.style.color = '#ef4444';
    }
}

// Form switch fonksiyonu
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const errorMessage = document.getElementById('errorMessage');
    
    errorMessage.classList.remove('show');
    
    if (formType === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Şifre göster/gizle
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.classList.remove('fa-eye');
        button.classList.add('fa-eye-slash');
    } else {
        input.type = 'password';
        button.classList.remove('fa-eye-slash');
        button.classList.add('fa-eye');
    }
}

// Login
async function handleLogin(event) {
    event.preventDefault();
    
    const loginInput = document.getElementById('loginInput').value.trim();
    const password = document.getElementById('loginPassword').value;
    const loginBtn = document.getElementById('loginBtn');
    
    if (!loginInput || !password) {
        showError('Tüm alanları doldurun');
        return;
    }
    
    // Butonu devre dışı bırak
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="spinner"></div> Giriş yapılıyor...';
    
    try {
        const response = await fetch(`${getBackendURL()}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                login: loginInput,
                password: password 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Token'ı kaydet
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Chat sayfasına yönlendir
            window.location.href = '/chat';
        } else {
            const error = await response.json();
            
            if (error.requiresVerification) {
                // Email doğrulanmamış
                showError(error.error);
                setTimeout(() => {
                    switchForm('register');
                    showEmailVerificationMessage(error.email);
                }, 2000);
            } else {
                showError(error.error || 'Giriş başarısız');
            }
            
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
        }
        
    } catch (error) {
        console.error('Login error:', error);
        showError('Bağlantı hatası. Lütfen tekrar deneyin.');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Giriş Yap';
    }
}

// Register
async function handleRegister(event) {
    event.preventDefault();
    
    const firstName = document.getElementById('registerFirstName').value.trim();
    const lastName = document.getElementById('registerLastName').value.trim();
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
    const registerBtn = document.getElementById('registerBtn');
    
    // Frontend validasyonları
    if (!firstName || !lastName || !username || !email || !password || !passwordConfirm) {
        showError('Tüm alanları doldurun');
        return;
    }
    
    // Ad validasyonu
    if (firstName.length < 2 || !/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(firstName)) {
        showError('Geçerli bir ad giriniz (en az 2 harf)');
        return;
    }
    
    // Soyad validasyonu
    if (lastName.length < 2 || !/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(lastName)) {
        showError('Geçerli bir soyad giriniz (en az 2 harf)');
        return;
    }
    
    // Kullanıcı adı validasyonu
    if (username.length < 3 || username.length > 20) {
        showError('Kullanıcı adı 3-20 karakter olmalıdır');
        return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        showError('Kullanıcı adı sadece harf, rakam ve _ içerebilir');
        return;
    }
    
    // Email validasyonu
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Geçerli bir email giriniz');
        return;
    }
    
    // Şifre kontrolü
    if (password !== passwordConfirm) {
        showError('Şifreler eşleşmiyor');
        return;
    }
    
    if (password.length < 6) {
        showError('Şifre en az 6 karakter olmalıdır');
        return;
    }
    
    // Butonu devre dışı bırak
    registerBtn.disabled = true;
    registerBtn.innerHTML = '<div class="spinner"></div> Kayıt yapılıyor...';
    
    try {
        const response = await fetch(`${getBackendURL()}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                first_name: firstName,
                last_name: lastName,
                username: username,
                email: email,
                password: password 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (data.requiresVerification) {
                // Email doğrulama gerekiyor
                showSuccess(data.message);
                showEmailVerificationMessage(data.email);
            } else {
                // Eski sistem (token ile direkt giriş)
                localStorage.setItem('auth_token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.location.href = '/chat';
            }
        } else {
            showError(data.error || 'Kayıt başarısız');
            registerBtn.disabled = false;
            registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Kayıt Ol';
        }
        
    } catch (error) {
        console.error('Register error:', error);
        showError('Bağlantı hatası. Lütfen tekrar deneyin.');
        registerBtn.disabled = false;
        registerBtn.innerHTML = '<i class="fas fa-user-plus"></i> Kayıt Ol';
    }
}

function showEmailVerificationMessage(email) {
    const registerForm = document.getElementById('registerForm');
    registerForm.innerHTML = `
        <div style="text-align: center; padding: 30px 20px;">
            <div style="font-size: 60px; margin-bottom: 20px;">📧</div>
            <h2 style="margin-bottom: 15px; color: var(--text-primary);">Email Doğrulama</h2>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                <strong>${email}</strong> adresine bir doğrulama linki gönderdik.
            </p>
            <p style="color: var(--text-muted); font-size: 14px; margin-bottom: 25px; line-height: 1.6;">
                Lütfen email kutunuzu kontrol edin ve doğrulama linkine tıklayın.
                <br><br>
                Email gelmediyse spam klasörünü kontrol edin.
            </p>
            <button class="auth-btn" onclick="resendVerification('${email}')" style="margin-bottom: 15px;">
                📨 Doğrulama Linkini Tekrar Gönder
            </button>
            <a href="#" onclick="switchForm('login')" style="display: block; color: var(--text-secondary); font-size: 14px; text-decoration: none;">
                ← Giriş sayfasına dön
            </a>
        </div>
    `;
}

async function resendVerification(email) {
    try {
        showSuccess('Gönderiliyor...');
        
        const response = await fetch(`${getBackendURL()}/api/resend-verification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (response.ok) {
            showSuccess(data.message);
        } else {
            showError(data.error || 'İşlem başarısız');
        }
    } catch (error) {
        showError('Bağlantı hatası');
    }
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Eğer zaten giriş yapılmışsa chat sayfasına yönlendir
    const token = localStorage.getItem('auth_token');
    if (token) {
        // Token'ı doğrula
        fetch(`${getBackendURL()}/api/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            if (response.ok) {
                window.location.href = '/chat';
            } else {
                // Token geçersiz, temizle
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
            }
        })
        .catch(error => {
            console.error('Token validation error:', error);
        });
    }
});
