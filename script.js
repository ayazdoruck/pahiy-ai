const BACKEND_URL = 'web-production-ba19b.up.railway.app';

let conversationHistory = [];
let currentSessionId = generateSessionId();

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const messageCount = document.getElementById('messageCount');
const typingIndicator = document.getElementById('typingIndicator');

// Global kopyalama fonksiyonu - GELİŞTİRİLMİŞ
window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const originalCode = codeBlock.getAttribute('data-original-code');
    
    // Orijinal kodu decode et
    let text = originalCode;
    
    // HTML entity'leri decode et
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Boşlukları koru - özel karakterleri temizle
    text = text.replace(/<br>/g, '\n');
    
    // Fazladan boşlukları temizle
    text = text.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        // Buton görünümünü değiştir
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
        
        showNotification('✅ Kod panoya kopyalandı!', 'success');
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        
        // Fallback: textarea ile kopyalama
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        showNotification('✅ Kod panoya kopyalandı!', 'success');
    });
};

document.addEventListener('DOMContentLoaded', function() {
    updateStats();
    messageInput.focus();
    
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    checkBackendConnection();
});

async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        if (response.ok) {
            showNotification('✅ Backend bağlantısı başarılı!', 'success');
        }
    } catch (error) {
        console.error('Backend bağlantı hatası:', error);
        showNotification('❌ Backend bağlantısı yok!', 'error');
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    addMessage('user', message);
    showTyping();
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                session_id: currentSessionId
            })
        });

        const data = await response.json();
        
        hideTyping();
        
        if (response.ok) {
            addMessage('ai', data.response);
            await loadConversationFromBackend();
            updateStats();
        } else {
            throw new Error(data.error || 'Sunucu hatası');
        }
        
    } catch (error) {
        hideTyping();
        console.error('Mesaj gönderme hatası:', error);
        const fallbackResponse = await getFallbackAIResponse(message);
        addMessage('ai', formatPlainText(fallbackResponse + '\n\n⚠️ (Backend bağlantısı yok - lokal mod)'));
        showNotification('❌ Backend hatası - Lokal moda geçildi', 'error');
    }
}

function formatPlainText(text) {
    return text.replace(/\n/g, '<br>');
}

async function loadConversationFromBackend() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/history?session_id=${currentSessionId}`);
        if (response.ok) {
            const data = await response.json();
            conversationHistory = data.history || [];
        }
    } catch (error) {
        console.error('Geçmiş yükleme hatası:', error);
    }
}

async function getFallbackAIResponse(userMessage) {
    const responses = [
        "Anladım! Bu konuda size nasıl yardımcı olabilirim?",
        "Harika bir soru! Bunu şöyle açıklayabilirim...",
        "Bu konu hakkında daha önce de konuşmuştuk. Hatırlattığım iyi oldu!",
        "Size bu konuda detaylı bilgi verebilirim.",
        "Anlıyorum. Biraz daha detaylandırabilir misiniz?",
        "Bu harika bir nokta! Bunu daha önce düşünmemiştim."
    ];
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('kaçta') || lowerMessage.includes('saat')) {
        return "Daha önce 16:00'da dışarı çıkacağınızı söylemiştiniz.";
    }
    
    if (lowerMessage.includes('adım') || lowerMessage.includes('isim')) {
        return "İsminizin Ayaz olduğunu biliyorum.";
    }
    
    if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağ ol')) {
        return "Rica ederim! Size yardımcı olabildiğim için mutluyum.";
    }
    
    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
        return "Merhaba! Ben Pahiy AI. Size nasıl yardımcı olabilirim?";
    }
    
    return responses[Math.floor(Math.random() * responses.length)];
}

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = new Date().toLocaleTimeString('tr-TR', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messageDiv.style.animation = 'messageSlide 0.4s ease';
    
    // Hemen scroll yap
    scrollToBottom();
}

function showTyping() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.style.display = 'none';
    scrollToBottom();
}

function scrollToBottom() {
    // Basit ve etkili scroll
    const container = messagesContainer;
    
    // Hemen scroll yap
    container.scrollTop = container.scrollHeight;
    
    // Ekstra güvenlik için bir kez daha
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 10);
}

function updateStats() {
    // Stats kaldırıldı - sade tasarım için
}

async function clearMemory() {
    if (confirm('Tüm konuşma geçmişi silinecek. Emin misiniz?')) {
        try {
            await fetch(`${BACKEND_URL}/api/clear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: currentSessionId
                })
            });
            
            conversationHistory = [];
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <div class="welcome-icon">AI</div>
                    <h2>Merhaba! Ben Pahiy AI</h2>
                    <p>Konuşma hafızası temizlendi. Yeniden başlıyoruz!</p>
                </div>
            `;
            updateStats();
            
            showNotification('Hafıza temizlendi!', 'success');
            
        } catch (error) {
            console.error('Hafıza temizleme hatası:', error);
            showNotification('❌ Hafıza temizlenemedi', 'error');
        }
    }
}

async function showHistory() {
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');
    
    content.innerHTML = '<div class="loading">Yükleniyor...</div>';
    
    try {
        await loadConversationFromBackend();
        
        content.innerHTML = '';
        
        if (conversationHistory.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Henüz konuşma yok.</p>';
        } else {
            conversationHistory.forEach((msg, index) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <strong>${msg.role === 'user' ? 'Sen' : 'Pahiy AI'}:</strong>
                    <div class="message-content">${msg.content}</div>
                    <small style="color: var(--text-muted);">${new Date(msg.timestamp).toLocaleTimeString('tr-TR')}</small>
                `;
                content.appendChild(item);
            });
        }
        
        modal.style.display = 'block';
        
    } catch (error) {
        content.innerHTML = '<p style="text-align: center; color: red;">Geçmiş yüklenemedi</p>';
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function toggleTheme() {
    // Tema sistemi kaldırıldı - sadece siyah tema
}

function showInfo() {
    alert(`Pahiy AI\n\n• Backend: ${BACKEND_URL}\n• Session: ${currentSessionId}\n• Toplam mesaj: ${conversationHistory.length}\n\nAI entegrasyonu ile gerçek yanıtlar!`);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 1000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}
