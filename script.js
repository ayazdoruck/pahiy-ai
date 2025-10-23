const BACKEND_URL = 'https://web-production-ba19b.up.railway.app';

// State management
let conversationHistory = [];
let currentSessionId = generateSessionId();
let isOnline = true;
let currentTheme = 'dark';

// DOM Elements
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const typingIndicator = document.getElementById('typingIndicator');
const sendButton = document.getElementById('sendButton');
const charCount = document.getElementById('charCount');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    loadUserPreferences();
    setupEventListeners();
    checkBackendConnection();
    updateCharacterCount();
    setupMobileDetection();
    
    // Focus input on startup
    setTimeout(() => messageInput.focus(), 500);
}

function setupEventListeners() {
    // Input events
    messageInput.addEventListener('input', function() {
        updateCharacterCount();
        autoResizeTextarea();
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
        
        // Ctrl/Cmd + K for focus
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            messageInput.focus();
        }
    });
    
    messageInput.addEventListener('focus', function() {
        document.activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    
    // Theme change events
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            setTheme(this.dataset.theme);
        });
    });
    
    // Settings toggles
    document.getElementById('animationsToggle')?.addEventListener('change', toggleAnimations);
    document.getElementById('soundsToggle')?.addEventListener('change', toggleSounds);
    document.getElementById('autoScrollToggle')?.addEventListener('change', toggleAutoScroll);
    
    // Online/offline detection
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    // Touch events for mobile
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
}

function setupMobileDetection() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
        document.body.classList.add('mobile');
        showNotification('📱 Mobil modda görüntüleniyor', 'success');
    }
}

function generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Enhanced copy function
window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const originalCode = codeBlock.getAttribute('data-original-code');
    
    let text = originalCode;
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&amp;/g, '&')
              .replace(/&quot;/g, '"')
              .replace(/&#39;/g, "'")
              .replace(/<br>/g, '\n')
              .trim();

    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
        
        showNotification('✅ Kod panoya kopyalandı!', 'success');
        playSound('success');
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        showNotification('✅ Kod panoya kopyalandı!', 'success');
        playSound('success');
    });
};

async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // Disable input during processing
    messageInput.disabled = true;
    sendButton.disabled = true;
    
    // Clear input
    messageInput.value = '';
    messageInput.style.height = 'auto';
    updateCharacterCount();
    
    // Add user message
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
            playSound('message');
        } else {
            throw new Error(data.error || 'Sunucu hatası');
        }
        
    } catch (error) {
        hideTyping();
        console.error('Mesaj gönderme hatası:', error);
        const fallbackResponse = await getFallbackAIResponse(message);
        addMessage('ai', formatPlainText(fallbackResponse + '\n\n⚠️ (Backend bağlantısı yok - lokal mod)'));
        showNotification('❌ Backend hatası - Lokal moda geçildi', 'error');
        playSound('error');
    } finally {
        // Re-enable input
        messageInput.disabled = false;
        sendButton.disabled = false;
        messageInput.focus();
    }
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
    
    // Add animation if enabled
    if (getSetting('animations')) {
        messageDiv.style.animation = 'messageSlide 0.4s ease';
    }
    
    scrollToBottom();
    
    // Add to local history
    conversationHistory.push({
        role: role,
        content: content,
        timestamp: new Date().toISOString()
    });
}

function showTyping() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    if (!getSetting('autoScroll')) return;
    
    const container = messagesContainer;
    container.scrollTop = container.scrollHeight;
    
    // Double check for mobile
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 100);
}

function updateCharacterCount() {
    const count = messageInput.value.length;
    charCount.textContent = count;
    
    // Update color based on count
    if (count > 800) {
        charCount.style.color = 'var(--warning)';
    } else if (count > 950) {
        charCount.style.color = 'var(--error)';
    } else {
        charCount.style.color = 'var(--text-muted)';
    }
}

function autoResizeTextarea() {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

// Quick Actions
function quickAction(action) {
    const prompts = {
        'kod_yaz': 'Bana bir JavaScript fonksiyonu yazabilir misin?',
        'aciklama': 'Bu konuyu detaylıca açıklar mısın?',
        'cevir': 'Şu metni İngilizceye çevirebilir misin: '
    };
    
    messageInput.value = prompts[action] || '';
    messageInput.focus();
    autoResizeTextarea();
    updateCharacterCount();
    showNotification('🚀 Hızlı aksiyon hazır!', 'success');
}

// Theme Management
function setTheme(theme) {
    currentTheme = theme;
    document.body.setAttribute('data-theme', theme);
    
    // Update theme buttons
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
    
    saveUserPreferences();
    showNotification(`🎨 ${theme === 'dark' ? 'Koyu' : theme === 'light' ? 'Açık' : 'Otomatik'} tema aktif`, 'success');
}

function toggleTheme() {
    const themes = ['dark', 'light', 'auto'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
}

// Settings Management
function getSetting(setting) {
    const settings = JSON.parse(localStorage.getItem('pahiy_settings') || '{}');
    return settings[setting] !== undefined ? settings[setting] : true;
}

function saveSetting(setting, value) {
    const settings = JSON.parse(localStorage.getItem('pahiy_settings') || '{}');
    settings[setting] = value;
    localStorage.setItem('pahiy_settings', JSON.stringify(settings));
}

function toggleAnimations(e) {
    saveSetting('animations', e.target.checked);
    showNotification(`Animasyonlar ${e.target.checked ? 'açıldı' : 'kapatıldı'}`, 'success');
}

function toggleSounds(e) {
    saveSetting('sounds', e.target.checked);
    showNotification(`Sesler ${e.target.checked ? 'açıldı' : 'kapatıldı'}`, 'success');
}

function toggleAutoScroll(e) {
    saveSetting('autoScroll', e.target.checked);
    showNotification(`Otomatik scroll ${e.target.checked ? 'açıldı' : 'kapatıldı'}`, 'success');
}

// Sound Management
function playSound(type) {
    if (!getSetting('sounds')) return;
    
    // Basit ses efektleri (gerçek uygulamada Audio objesi kullanılabilir)
    const context = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    switch(type) {
        case 'message':
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            break;
        case 'success':
            oscillator.frequency.setValueAtTime(1200, context.currentTime);
            break;
        case 'error':
            oscillator.frequency.setValueAtTime(400, context.currentTime);
            break;
    }
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.5);
    
    oscillator.start();
    oscillator.stop(context.currentTime + 0.5);
}

// Mobile Touch Handling
let touchStartY = 0;

function handleTouchStart(e) {
    touchStartY = e.touches[0].clientY;
}

function handleTouchEnd(e) {
    const touchEndY = e.changedTouches[0].clientY;
    const diff = touchStartY - touchEndY;
    
    // Hide keyboard on significant swipe down
    if (diff > 50 && document.activeElement === messageInput) {
        messageInput.blur();
    }
}

// Online/Offline Handling
function handleOnlineStatus() {
    isOnline = navigator.onLine;
    if (isOnline) {
        showNotification('✅ İnternet bağlantısı aktif', 'success');
        checkBackendConnection();
    } else {
        showNotification('❌ İnternet bağlantısı yok', 'error');
    }
}

async function checkBackendConnection() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/health`);
        if (response.ok) {
            showNotification('✅ Backend bağlantısı başarılı!', 'success');
            isOnline = true;
        }
    } catch (error) {
        console.error('Backend bağlantı hatası:', error);
        isOnline = false;
    }
}

// Modal Management
function showHistory() {
    const modal = document.getElementById('historyModal');
    const content = document.getElementById('historyContent');
    
    content.innerHTML = '<div class="loading">Yükleniyor...</div>';
    modal.style.display = 'block';
    
    loadHistoryContent();
}

function showSettings() {
    const modal = document.getElementById('settingsModal');
    
    // Load current settings
    document.getElementById('animationsToggle').checked = getSetting('animations');
    document.getElementById('soundsToggle').checked = getSetting('sounds');
    document.getElementById('autoScrollToggle').checked = getSetting('autoScroll');
    
    modal.style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

async function loadHistoryContent() {
    const content = document.getElementById('historyContent');
    
    try {
        await loadConversationFromBackend();
        
        content.innerHTML = '';
        
        if (conversationHistory.length === 0) {
            content.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 40px 20px;">Henüz konuşma geçmişi yok.</p>';
        } else {
            conversationHistory.forEach((msg, index) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div style="display: flex; justify-content: between; align-items: start; gap: 12px;">
                        <div style="flex: 1;">
                            <strong>${msg.role === 'user' ? '👤 Sen' : '🤖 Pahiy AI'}:</strong>
                            <div class="message-content">${msg.content}</div>
                            <small style="color: var(--text-muted);">${new Date(msg.timestamp).toLocaleString('tr-TR')}</small>
                        </div>
                        <button onclick="deleteHistoryItem(${index})" class="action-btn" style="color: var(--error);">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                content.appendChild(item);
            });
        }
        
    } catch (error) {
        content.innerHTML = '<p style="text-align: center; color: var(--error); padding: 40px 20px;">Geçmiş yüklenemedi</p>';
    }
}

function deleteHistoryItem(index) {
    if (confirm('Bu mesajı silmek istediğinizden emin misiniz?')) {
        conversationHistory.splice(index, 1);
        loadHistoryContent();
        showNotification('🗑️ Mesaj silindi', 'success');
    }
}

function exportHistory() {
    const data = {
        sessionId: currentSessionId,
        exportDate: new Date().toISOString(),
        conversation: conversationHistory
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pahiy-chat-${currentSessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('📤 Konuşma dışa aktarıldı', 'success');
}

function searchHistory() {
    const query = prompt('Aranacak kelimeyi yazın:');
    if (query) {
        const results = conversationHistory.filter(msg => 
            msg.content.toLowerCase().includes(query.toLowerCase())
        );
        
        if (results.length > 0) {
            const content = document.getElementById('historyContent');
            content.innerHTML = '';
            
            results.forEach((msg, index) => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <strong>${msg.role === 'user' ? 'Sen' : 'Pahiy AI'}:</strong>
                    <div class="message-content">${highlightText(msg.content, query)}</div>
                    <small style="color: var(--text-muted);">${new Date(msg.timestamp).toLocaleString('tr-TR')}</small>
                `;
                content.appendChild(item);
            });
            
            showNotification(`🔍 ${results.length} sonuç bulundu`, 'success');
        } else {
            showNotification('❌ Sonuç bulunamadı', 'error');
        }
    }
}

function highlightText(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark style="background: var(--accent); color: white; padding: 2px 4px; border-radius: 4px;">$1</mark>');
}

// Utility Functions
function formatPlainText(text) {
    return text.replace(/\n/g, '<br>');
}

async function loadConversationFromBackend() {
    if (!isOnline) return;
    
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

function clearMemory() {
    if (confirm('Tüm konuşma geçmişi silinecek. Emin misiniz?')) {
        fetch(`${BACKEND_URL}/api/clear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: currentSessionId })
        }).catch(console.error);
        
        conversationHistory = [];
        messagesContainer.innerHTML = `
            <div class="welcome-message">
                <div class="welcome-icon">
                    <i class="fas fa-robot"></i>
                </div>
                <h2>Merhaba! Ben Pahiy AI</h2>
                <p>Konuşma hafızası temizlendi. Yeniden başlıyoruz!</p>
            </div>
        `;
        
        showNotification('🧹 Hafıza temizlendi!', 'success');
        playSound('success');
    }
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// User Preferences
function loadUserPreferences() {
    const prefs = JSON.parse(localStorage.getItem('pahiy_preferences') || '{}');
    
    if (prefs.theme) {
        setTheme(prefs.theme);
    }
    
    if (prefs.sessionId) {
        currentSessionId = prefs.sessionId;
    }
}

function saveUserPreferences() {
    const prefs = {
        theme: currentTheme,
        sessionId: currentSessionId
    };
    localStorage.setItem('pahiy_preferences', JSON.stringify(prefs));
}

// Mobile specific functions
function scrollToBottom() {
    if (!getSetting('autoScroll')) return;
    
    const container = messagesContainer;
    container.scrollTop = container.scrollHeight;
    
    // Additional checks for mobile
    if (document.body.classList.contains('mobile')) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 150);
    }
}

// Global close modal on outside click
window.onclick = function(event) {
    const modals = document.getElementsByClassName('modal');
    for (let modal of modals) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}

// Add attachment placeholder
function addAttachment() {
    showNotification('📎 Dosya ekleme özelliği yakında eklenecek!', 'info');
}

// Add emoji placeholder
function addEmoji() {
    showNotification('😊 Emoji picker yakında eklenecek!', 'info');
}

// Mobile nav activation
function setActiveMobileNav(button) {
    document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    button.classList.add('active');
}

// Register service worker for PWA (future enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // navigator.serviceWorker.register('/sw.js');
    });
}