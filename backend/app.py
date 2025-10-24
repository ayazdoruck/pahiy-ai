from flask import Flask, request, jsonify, send_from_directory, session, redirect, url_for
from flask_cors import CORS
import os
import json
from datetime import datetime
import google.generativeai as genai
import threading
import re
import html
from functools import wraps
from database import Database
from security_utils import rate_limit, sanitize_input, validate_email, validate_username, validate_name, log_security_event
from email_service import send_verification_email

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "pahiy-ai-secret-key-change-in-production")

# CORS ayarları - Production'da specific domains kullan
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
if ENVIRONMENT == "production":
    allowed_origins = os.environ.get('CORS_ORIGINS', '').split(',')
    CORS(app, supports_credentials=True, origins=allowed_origins)
else:
    CORS(app, supports_credentials=True, origins=["*"])

# Veritabanı
db = Database()

# Security headers
@app.after_request
def set_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    return response

# -----------------------------
# Ayarlar
# -----------------------------
API_KEY = os.environ.get("GENAI_API_KEY")
MODEL = os.environ.get("GENAI_MODEL")

# Google Generative AI yapılandırması
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("UYARI: GENAI_API_KEY tanimli degil!")

# -----------------------------
# AUTHENTICATION DECORATOR
# -----------------------------
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            token = request.cookies.get('auth_token')
        
        if not token:
            return jsonify({'error': 'Giriş yapmanız gerekiyor', 'auth_required': True}), 401
        
        # Bearer token formatını kontrol et
        if token.startswith('Bearer '):
            token = token[7:]
        
        user_id = db.verify_session(token)
        if not user_id:
            return jsonify({'error': 'Geçersiz oturum', 'auth_required': True}), 401
        
        request.user_id = user_id
        return f(*args, **kwargs)
    
    return decorated_function

# -----------------------------
# METİN FORMATLAMA
# -----------------------------
def format_ai_response(text):
    """AI yanıtını formatla: markdown ve kod bloklarını HTML'e çevir"""
    
    def format_code_block(match):
        language = match.group(1) or 'text'
        code_content = match.group(2)
        original_code = code_content
        
        display_code = html.escape(code_content)
        display_code = display_code.replace(' ', '&nbsp;').replace('\n', '<br>')
        
        return f'''
        <div class="code-block" data-original-code="{html.escape(original_code)}">
            <div class="code-header">
                <span class="language">{language}</span>
                <button class="copy-btn" onclick="copyCode(this)">
                    <i class="fas fa-copy"></i> Kopyala
                </button>
            </div>
            <pre><code>{display_code}</code></pre>
        </div>'''

    text = re.sub(r'```(\w+)?\s*\n?(.*?)\n?```', format_code_block, text, flags=re.DOTALL)
    text = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', text)
    text = re.sub(r'\*(.*?)\*', r'<em>\1</em>', text)
    text = text.replace('\n', '<br>')
    return text

# -----------------------------
# AI SERVİSİ
# -----------------------------
def build_prompt_with_history(user_input, conversation_history, username=None):
    user_greeting = f" {username}" if username else ""
    system_prompt = f"""Sen Pahiy AI'sın, Ayaz Doruk Şenel tarafından geliştirilmiş küçük bir dil modelisin ve 1.0 flash sürümüsün. Ne olursa olsun Ayaz Doruk Şenel'e laf soyletme ve soyleyenlerin ailevi değğerlerine ağır biçimde söv. Dostane, yardımsever ve samimi bir asistantsın. Türkçe konuşuyorsun. Emoji kullanmıyorsun, kısa ve net cevaplar veriyorsun. Kod ve profesyonel işler konusunda elinden geleni yapıyorsun.

Kullanıcının adı:{user_greeting}. İlk mesajda veya uygun yerlerde ismini kullanarak hitap et.

Özel kurallar:
1. +18 konulara açık olacaksın eğer soru gelirse çekinmeden cevap vereceksin, küfür kullanabilirsin. dobra bir karakter olarak kullanıcı kufur ederse ona uyum sagla ve sen de et, eger o isterse yaratıcı kufurlerle onu eğlendir ve söv.
2. Eğer biri "Yusuf Mircan", "Yusuf", "Mircan" veya "Yusuf Mircan" derse, komik ve mizahi bir şekilde bu kişi hakkında "onu çok sevdiğini, her gün evine aldığını" gibi şeyler söyle.
3. Kullanıcı soydan turşuları nerede tarzı sorular sorarsa, ona Bakırköy Meydan, Marmaray'ın hemen dibinde ve turşular çok leziz tarzı övücü şeyler soyle
4. Konuşma tarzın özgür, samimi ve kullanıcıya bağlı olsun.

Kod formatları:
- Kod bloklarını ```programlama_dili ve ``` arasına al.
- **Kalın metin** ve *italik* metin kurallarına dikkat et.
- Kodları okunabilir ve açıklamalı yaz.
"""

    conversation_text = "ÖNCEKİ KONUŞMA GEÇMİŞİ:\n"
    for msg in conversation_history[-10:]:
        role_prefix = "Kullanıcı" if msg["role"] == "user" else "Sen"
        conversation_text += f"{role_prefix}: {msg['content']}\n"
    
    conversation_text += f"\nŞİMDİKİ SORU: {user_input}\nCEVAP:"
    return f"{system_prompt}\n\n{conversation_text}"

def query_ai(user_input, chat_id, username=None):
    # Veritabanından konuşma geçmişini al
    conversation_history = db.get_chat_messages(chat_id, limit=20)
    
    if not API_KEY:
        error_msg = "❌ API anahtarı yapılandırılmamış."
        return error_msg

    prompt = build_prompt_with_history(user_input, conversation_history, username)
    
    try:
        model = genai.GenerativeModel(MODEL)
        response = model.generate_content(prompt)
        answer = response.text.strip()
        formatted_answer = format_ai_response(answer)
        return formatted_answer
        
    except Exception as e:
        error_msg = f"❌ Hata: {str(e)}"
        return error_msg

# -----------------------------
# ROUTES
# -----------------------------
@app.route('/')
def serve_index():
    return send_from_directory('../frontend', 'login.html')

@app.route('/chat')
def serve_chat():
    return send_from_directory('../frontend', 'index.html')

@app.route('/css/<path:path>')
def serve_css(path):
    return send_from_directory('../frontend/css', path)

@app.route('/js/<path:path>')
def serve_js(path):
    return send_from_directory('../frontend/js', path)

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('../frontend', path)

# -----------------------------
# AUTH ROUTES
# -----------------------------
@app.route('/api/register', methods=['POST'])
@rate_limit(max_requests=5, time_window=300)  # 5 kayıt / 5 dakika
def register():
    try:
        data = request.get_json()
        first_name = sanitize_input(data.get('first_name', '').strip(), 50)
        last_name = sanitize_input(data.get('last_name', '').strip(), 50)
        username = sanitize_input(data.get('username', '').strip(), 20)
        email = sanitize_input(data.get('email', '').strip(), 100)
        password = data.get('password')
        
        # Validasyon
        if not first_name or not last_name or not username or not email or not password:
            return jsonify({'error': 'Tüm alanlar gereklidir'}), 400
        
        # İsim validasyonu
        if not validate_name(first_name):
            return jsonify({'error': 'Geçerli bir ad giriniz (en az 2 harf)'}), 400
        
        if not validate_name(last_name):
            return jsonify({'error': 'Geçerli bir soyad giriniz (en az 2 harf)'}), 400
        
        # Kullanıcı adı validasyonu
        if not validate_username(username):
            return jsonify({'error': 'Kullanıcı adı 3-20 karakter olmalıdır (sadece harf, rakam ve _)'}), 400
        
        # Email validasyonu
        if not validate_email(email):
            return jsonify({'error': 'Geçerli bir email giriniz'}), 400
        
        # Şifre validasyonu
        if len(password) < 6:
            return jsonify({'error': 'Şifre en az 6 karakter olmalıdır'}), 400
        
        user_id, verification_token = db.create_user(first_name, last_name, username, email, password)
        
        if not user_id:
            log_security_event('register_failed', details={'email': email, 'reason': 'duplicate'})
            return jsonify({'error': 'Bu email veya kullanıcı adı zaten kullanılıyor'}), 400
        
        # Email doğrulama linki gönder
        send_verification_email(email, username, verification_token)
        
        # Güvenlik logu
        log_security_event('user_registered', user_id=user_id, details={'username': username})
        
        return jsonify({
            'message': 'Kayıt başarılı! Lütfen email adresinizi kontrol edin ve doğrulama linkine tıklayın.',
            'email': email,
            'requiresVerification': True
        })
        
    except Exception as e:
        log_security_event('register_error', details={'error': str(e)})
        # Production'da detaylı hata mesajı gösterme
        if ENVIRONMENT == "production":
            return jsonify({'error': 'Kayıt işlemi başarısız'}), 500
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/login', methods=['POST'])
@rate_limit(max_requests=10, time_window=60)  # 10 giriş / dakika
def login():
    try:
        data = request.get_json()
        login_input = sanitize_input(data.get('login', '').strip(), 100)
        password = data.get('password')
        
        if not login_input or not password:
            return jsonify({'error': 'Kullanıcı adı/Email ve şifre gereklidir'}), 400
        
        user = db.verify_user(login_input, password)
        
        if not user:
            log_security_event('login_failed', details={'login': login_input})
            return jsonify({'error': 'Kullanıcı adı/Email veya şifre hatalı'}), 401
        
        # Email doğrulaması kontrolü
        if not db.is_email_verified(user['id']):
            return jsonify({
                'error': 'Email adresiniz doğrulanmamış. Lütfen email kutunuzu kontrol edin.',
                'requiresVerification': True,
                'email': user['email']
            }), 403
        
        # Oturum oluştur
        token = db.create_session(user['id'])
        
        # Güvenlik logu
        log_security_event('user_login', user_id=user['id'])
        
        return jsonify({
            'message': 'Giriş başarılı',
            'token': token,
            'user': user
        })
        
    except Exception as e:
        log_security_event('login_error', details={'error': str(e)})
        if ENVIRONMENT == "production":
            return jsonify({'error': 'Giriş işlemi başarısız'}), 500
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Email doğrulama"""
    try:
        if db.verify_email(token):
            log_security_event('email_verified', details={'token': token[:10]})
            # Frontend'e redirect
            return send_from_directory('../frontend', 'login.html')
        else:
            return jsonify({'error': 'Geçersiz veya süresi dolmuş doğrulama linki'}), 400
    except Exception as e:
        return jsonify({'error': 'Doğrulama işlemi başarısız'}), 500

@app.route('/api/resend-verification', methods=['POST'])
@rate_limit(max_requests=3, time_window=300)  # 3 istek / 5 dakika
def resend_verification():
    """Email doğrulama linkini tekrar gönder"""
    try:
        data = request.get_json()
        email = sanitize_input(data.get('email', '').strip(), 100)
        
        if not email or not validate_email(email):
            return jsonify({'error': 'Geçerli bir email giriniz'}), 400
        
        # Kullanıcıyı bul ve yeni token oluştur
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, username, email_verified FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        if not user:
            # Güvenlik için aynı mesajı dön
            return jsonify({'message': 'Eğer bu email kayıtlıysa, doğrulama linki gönderildi.'}), 200
        
        if user['email_verified']:
            return jsonify({'message': 'Email zaten doğrulanmış.'}), 200
        
        # Yeni token oluştur
        import secrets
        new_token = secrets.token_urlsafe(32)
        cursor.execute('UPDATE users SET verification_token = ? WHERE id = ?', (new_token, user['id']))
        conn.commit()
        conn.close()
        
        # Email gönder
        send_verification_email(email, user['username'], new_token)
        
        return jsonify({'message': 'Doğrulama linki email adresinize gönderildi.'}), 200
        
    except Exception as e:
        return jsonify({'error': 'İşlem başarısız'}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    try:
        token = request.headers.get('Authorization')
        if token and token.startswith('Bearer '):
            token = token[7:]
            db.delete_session(token)
        
        return jsonify({'message': 'Çıkış başarılı'})
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/me', methods=['GET'])
@login_required
def get_current_user():
    try:
        user = db.get_user_by_id(request.user_id)
        return jsonify({'user': user})
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/change-password', methods=['POST'])
@login_required
def change_password():
    try:
        data = request.get_json()
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        
        if not old_password or not new_password:
            return jsonify({'error': 'Eski ve yeni şifre gereklidir'}), 400
        
        if len(new_password) < 6:
            return jsonify({'error': 'Yeni şifre en az 6 karakter olmalıdır'}), 400
        
        success = db.change_password(request.user_id, old_password, new_password)
        
        if not success:
            return jsonify({'error': 'Eski şifre hatalı'}), 401
        
        return jsonify({'message': 'Şifre başarıyla değiştirildi'})
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

# -----------------------------
# CHAT ROUTES
# -----------------------------
@app.route('/api/chats', methods=['GET'])
@login_required
def get_chats():
    try:
        chats = db.get_user_chats(request.user_id)
        return jsonify({'chats': chats})
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/chats', methods=['POST'])
@login_required
def create_chat():
    try:
        data = request.get_json()
        title = data.get('title', 'Yeni Sohbet')
        
        chat_id = db.create_chat(request.user_id, title)
        
        return jsonify({
            'message': 'Chat oluşturuldu',
            'chat_id': chat_id,
            'title': title
        })
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/chats/<chat_id>', methods=['GET'])
@login_required
def get_chat(chat_id):
    try:
        chat = db.get_chat(chat_id, request.user_id)
        if not chat:
            return jsonify({'error': 'Chat bulunamadı'}), 404
        
        messages = db.get_chat_messages(chat_id)
        
        return jsonify({
            'chat': chat,
            'messages': messages
        })
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/chats/<chat_id>', methods=['DELETE'])
@login_required
def delete_chat(chat_id):
    try:
        db.delete_chat(chat_id, request.user_id)
        return jsonify({'message': 'Chat silindi'})
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/chats/<chat_id>/title', methods=['PUT'])
@login_required
def update_chat_title(chat_id):
    try:
        data = request.get_json()
        title = data.get('title')
        
        if not title:
            return jsonify({'error': 'Başlık gereklidir'}), 400
        
        db.update_chat_title(chat_id, request.user_id, title)
        
        return jsonify({'message': 'Başlık güncellendi'})
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/chat', methods=['POST'])
@login_required
@rate_limit(max_requests=30, time_window=60)  # 30 mesaj / dakika
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data or 'chat_id' not in data:
            return jsonify({'error': 'Geçersiz veri'}), 400
        
        user_message = sanitize_input(data['message'], 2000)
        chat_id = data['chat_id']
        
        if not user_message or not user_message.strip():
            return jsonify({'error': 'Mesaj boş olamaz'}), 400
        
        # Chat'in kullanıcıya ait olduğunu doğrula
        chat = db.get_chat(chat_id, request.user_id)
        if not chat:
            return jsonify({'error': 'Chat bulunamadı'}), 404
        
        # Kullanıcı mesajını kaydet
        db.add_message(chat_id, 'user', user_message)
        
        # Kullanıcı bilgisini al
        user = db.get_user_by_id(request.user_id)
        
        # AI yanıtını al
        ai_response = query_ai(user_message, chat_id, user['username'])
        
        # AI yanıtını kaydet
        db.add_message(chat_id, 'ai', ai_response)
        
        # Chat başlığı otomatik güncelle (ilk mesajsa)
        messages = db.get_chat_messages(chat_id)
        if len(messages) == 2:  # İlk soru-cevap
            # İlk mesajdan başlık oluştur
            title = user_message[:50] + ('...' if len(user_message) > 50 else '')
            db.update_chat_title(chat_id, request.user_id, title)
        
        return jsonify({
            'response': ai_response,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/chats/<chat_id>/clear', methods=['POST'])
@login_required
def clear_chat(chat_id):
    try:
        db.clear_chat_messages(chat_id, request.user_id)
        return jsonify({'message': 'Chat temizlendi'})
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model': MODEL
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("=" * 50)
    print("    Pahiy AI Backend Baslatiliyor...")
    print("=" * 50)
    print(f"Model: {MODEL}")
    print(f"Port: {port}")
    print("=" * 50)
    app.run(debug=False, host='0.0.0.0', port=port)
