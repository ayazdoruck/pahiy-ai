"""
Güvenlik yardımcı fonksiyonları
"""
import time
from functools import wraps
from flask import request, jsonify
from collections import defaultdict
from datetime import datetime, timedelta

# Rate limiting için basit in-memory store
# Production'da Redis kullan!
request_counts = defaultdict(lambda: {'count': 0, 'reset_time': time.time()})

def rate_limit(max_requests=10, time_window=60):
    """
    Rate limiting decorator
    max_requests: Zaman aralığında maksimum istek sayısı
    time_window: Zaman aralığı (saniye)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # IP adresini al
            ip = request.headers.get('X-Forwarded-For', request.remote_addr)
            if ip:
                ip = ip.split(',')[0].strip()
            
            current_time = time.time()
            key = f"{ip}:{request.endpoint}"
            
            # Reset time geçtiyse sayacı sıfırla
            if current_time > request_counts[key]['reset_time']:
                request_counts[key] = {
                    'count': 0,
                    'reset_time': current_time + time_window
                }
            
            # İstek sayısını kontrol et
            if request_counts[key]['count'] >= max_requests:
                return jsonify({
                    'error': 'Çok fazla istek. Lütfen biraz bekleyin.',
                    'retry_after': int(request_counts[key]['reset_time'] - current_time)
                }), 429
            
            # İstek sayısını artır
            request_counts[key]['count'] += 1
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def sanitize_input(text, max_length=1000):
    """
    Kullanıcı input'unu temizle
    """
    if not text:
        return text
    
    # Maksimum uzunluk kontrolü
    text = text[:max_length]
    
    # Tehlikeli karakterleri kaldır (SQL injection önleme)
    # Not: Parameterized queries zaten kullanıyoruz, bu ekstra koruma
    dangerous_chars = ['<script', 'javascript:', 'onerror=', 'onload=']
    text_lower = text.lower()
    for char in dangerous_chars:
        if char in text_lower:
            text = text.replace(char, '')
    
    return text.strip()

def validate_email(email):
    """
    Email validasyonu
    """
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_username(username):
    """
    Kullanıcı adı validasyonu
    """
    import re
    if len(username) < 3 or len(username) > 20:
        return False
    pattern = r'^[a-zA-Z0-9_]+$'
    return re.match(pattern, username) is not None

def validate_name(name):
    """
    İsim validasyonu (sadece harf ve boşluk)
    """
    import re
    if len(name) < 2:
        return False
    pattern = r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$'
    return re.match(pattern, name) is not None

def check_password_strength(password):
    """
    Şifre gücünü kontrol et
    """
    if len(password) < 6:
        return False, "Şifre en az 6 karakter olmalıdır"
    
    # Opsiyonel: Daha güçlü şifre kuralları
    # has_upper = any(c.isupper() for c in password)
    # has_lower = any(c.islower() for c in password)
    # has_digit = any(c.isdigit() for c in password)
    # 
    # if not (has_upper and has_lower and has_digit):
    #     return False, "Şifre en az 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir"
    
    return True, "OK"

def get_client_ip():
    """
    Gerçek client IP'sini al (proxy arkasında bile)
    """
    # X-Forwarded-For header'ı kontrol et (proxy/load balancer arkasında)
    if request.headers.get('X-Forwarded-For'):
        ip = request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        ip = request.headers.get('X-Real-IP')
    else:
        ip = request.remote_addr
    
    return ip

def log_security_event(event_type, user_id=None, details=None):
    """
    Güvenlik olaylarını logla
    Production'da proper logging service kullan (Sentry, Loggly, etc.)
    """
    from datetime import datetime
    
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'event_type': event_type,
        'user_id': user_id,
        'ip': get_client_ip(),
        'user_agent': request.headers.get('User-Agent'),
        'endpoint': request.endpoint,
        'details': details
    }
    
    # Basit file logging (production'da database veya service kullan)
    import json
    try:
        with open('security.log', 'a') as f:
            f.write(json.dumps(log_entry) + '\n')
    except:
        pass  # Logging hatası uygulamayı durdurmamalı
    
    return log_entry

