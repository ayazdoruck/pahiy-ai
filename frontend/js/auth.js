// Backend URL - config.js'den gelecek
const getBackendURL = () => window.CONFIG?.BACKEND_URL || 'http://localhost:5000';

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

// Hata mesajı göster
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 5000);
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
            showError(data.error || 'Giriş başarısız');
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
            // Token'ı kaydet
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Chat sayfasına yönlendir
            window.location.href = '/chat';
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
