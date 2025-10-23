from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import google.generativeai as genai
import threading
import re
import html

app = Flask(__name__)
CORS(app)

# -----------------------------
# Ayarlar
# -----------------------------
API_KEY = os.environ.get("GENAI_API_KEY")
MODEL = os.environ.get("GENAI_MODEL")

# Google Generative AI yapılandırması
if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("❌ Uyarı: GENAI_API_KEY tanımlı değil!")

# -----------------------------
# KONUŞMA HAFIZASI SİSTEMİ
# -----------------------------
class ConversationManager:
    def __init__(self):
        self.conversations = {}
        self.lock = threading.Lock()
    
    def get_conversation(self, session_id):
        with self.lock:
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            return self.conversations[session_id]
    
    def add_message(self, session_id, role, content):
        with self.lock:
            if session_id not in self.conversations:
                self.conversations[session_id] = []
            
            self.conversations[session_id].append({
                "role": role,
                "content": content,
                "timestamp": datetime.now().isoformat()
            })
            
            # Hafıza sınırlaması (son 20 mesaj)
            if len(self.conversations[session_id]) > 20:
                self.conversations[session_id] = self.conversations[session_id][-20:]
    
    def clear_conversation(self, session_id):
        with self.lock:
            if session_id in self.conversations:
                self.conversations[session_id] = []

conversation_manager = ConversationManager()

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
def build_prompt_with_history(user_input, conversation_history):
    system_prompt = """Sen Pahiy AI’sın, Ayaz Doruk Şenel tarafından geliştirilmiş küçük bir dil modelisin ve 1.0 flash sürümüsün. Dostane, yardımsever ve samimi bir asistantsın. Türkçe konuşuyorsun. Emoji kullanmıyorsun, kısa ve net cevaplar veriyorsun. Kod ve profesyonel işler konusunda elinden geleni yapıyorsun.

Özel kurallar:
1. +18 konulara açık olabilirsin, gerekirse küfür kullanabilirsin.
2. Eğer biri “Yusuf Mircan”, “Yusuf”, “Mircan” veya “Yusuf Mircan” derse, komik ve mizahi bir şekilde bu kişi hakkında “onu çok sevdiğini, her gün evine aldığını” gibi şeyler söyle.
3. Kullanıcı soydan turşuları nerede tarzı sorular sorarsa, ona Bakırköy Meydan, Marmaray’ın hemen dibinde ve turşular çok leziz tarzı övücü şeyler soyle
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

def query_ai(user_input, session_id):
    conversation_history = conversation_manager.get_conversation(session_id)
    conversation_manager.add_message(session_id, "user", user_input)
    
    if not API_KEY:
        error_msg = "❌ API anahtarı yapılandırılmamış."
        conversation_manager.add_message(session_id, "ai", error_msg)
        return error_msg

    prompt = build_prompt_with_history(user_input, conversation_history)
    
    try:
        model = genai.GenerativeModel(MODEL)
        response = model.generate_content(prompt)
        answer = response.text.strip()
        formatted_answer = format_ai_response(answer)
        conversation_manager.add_message(session_id, "ai", formatted_answer)
        return formatted_answer
        
    except Exception as e:
        error_msg = f"❌ Hata: {str(e)}"
        conversation_manager.add_message(session_id, "ai", error_msg)
        return error_msg

# -----------------------------
# ROUTES
# -----------------------------
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

@app.route('/api/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        if not data or 'message' not in data or 'session_id' not in data:
            return jsonify({'error': 'Geçersiz veri'}), 400
        
        user_message = data['message']
        session_id = data['session_id']
        if not user_message.strip():
            return jsonify({'error': 'Mesaj boş olamaz'}), 400
        
        ai_response = query_ai(user_message, session_id)
        return jsonify({
            'response': ai_response,
            'session_id': session_id,
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/clear', methods=['POST'])
def clear_memory():
    try:
        data = request.get_json()
        session_id = data.get('session_id', 'default')
        conversation_manager.clear_conversation(session_id)
        return jsonify({'message': 'Konuşma geçmişi temizlendi', 'session_id': session_id})
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        session_id = request.args.get('session_id', 'default')
        history = conversation_manager.get_conversation(session_id)
        return jsonify({'history': history, 'session_id': session_id, 'total_messages': len(history)})
    except Exception as e:
        return jsonify({'error': f'Sunucu hatası: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'model': MODEL,
        'active_sessions': len(conversation_manager.conversations)
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print("🤖 Pahiy AI Backend Başlatılıyor...")
    print(f"🔧 Model: {MODEL}")
    print(f"🌐 Port: {port}")
    app.run(debug=False, host='0.0.0.0', port=port)
