// Backend URL - config.js'den gelecek
const BACKEND_URL = window.CONFIG.BACKEND_URL;

let currentUser = null;
let currentChatId = null;
let authToken = null;
let chatToDelete = null;

// ================== INIT ==================
document.addEventListener('DOMContentLoaded', function() {
    // Auth kontrolü
    authToken = localStorage.getItem('auth_token');
    if (!authToken) {
        window.location.href = '/';
        return;
    }

    // Kullanıcı bilgisini yükle
    loadCurrentUser();

    // Event listeners
    const messageInput = document.getElementById('messageInput');
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
    
    // Click outside to close menus
    document.addEventListener('click', function(e) {
        const userMenu = document.getElementById('userMenu');
        const userInfo = document.getElementById('userInfo');
        if (!userInfo.contains(e.target) && !userMenu.contains(e.target)) {
            userMenu.classList.remove('show');
        }
    });
});

// ================== AUTH ==================
async function loadCurrentUser() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            
            const fullName = `${currentUser.first_name} ${currentUser.last_name}`;
            document.getElementById('userName').textContent = fullName;
            document.getElementById('userEmail').textContent = currentUser.email;

            // Chatları yükle
            loadChats();
        } else {
            // Token geçersiz
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
    } catch (error) {
        console.error('User load error:', error);
        showNotification('Bağlantı hatası', 'error');
    }
}

function logout() {
    fetch(`${BACKEND_URL}/api/logout`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    }).finally(() => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/';
    });
}

function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    userMenu.classList.toggle('show');
}

// ================== CHAT MANAGEMENT ==================
async function loadChats() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/chats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            displayChats(data.chats);

            // Eğer chat yoksa, welcome screen göster
            if (data.chats.length === 0) {
                showWelcomeScreen();
            } else if (currentChatId) {
                // Eğer bir chat seçiliyse onu aç
                selectChat(currentChatId);
            } else {
                // Hiç chat seçili değilse, ilk chat'i aç
                selectChat(data.chats[0].id);
            }
        }
    } catch (error) {
        console.error('Load chats error:', error);
        showNotification('Chatler yüklenemedi', 'error');
    }
}

function showWelcomeScreen() {
    const messagesContainer = document.getElementById('messagesContainer');
    const fullName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Kullanıcı';
    
    messagesContainer.innerHTML = `
        <div class="welcome-message" style="animation: fadeIn 0.8s ease;">
            <h2>Merhaba ${fullName}! 👋</h2>
            <p>Size nasıl yardımcı olabilirim?</p>
            <button class="new-chat-btn" onclick="createNewChat()" style="margin: 30px auto; max-width: 300px;">
                <i class="fas fa-plus"></i> Sohbete Başla
            </button>
        </div>
    `;
    currentChatId = null;
}

function displayChats(chats) {
    const chatList = document.getElementById('chatList');
    
    if (chats.length === 0) {
        chatList.innerHTML = '<div class="loading">Henüz sohbet yok</div>';
        return;
    }

    chatList.innerHTML = '';
    
    chats.forEach(chat => {
        const chatItem = document.createElement('div');
        chatItem.className = 'chat-item';
        if (chat.id === currentChatId) {
            chatItem.classList.add('active');
        }
        chatItem.onclick = () => selectChat(chat.id);

        const date = new Date(chat.updated_at);
        const dateStr = formatDate(date);

        chatItem.innerHTML = `
            <div class="chat-item-content">
                <div class="chat-item-title">${escapeHtml(chat.title)}</div>
                <div class="chat-item-date">${dateStr}</div>
            </div>
            <div class="chat-item-actions">
                <button class="chat-action-btn delete" onclick="event.stopPropagation(); deleteChat('${chat.id}')" title="Sil">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        chatList.appendChild(chatItem);
    });
}

async function selectChat(chatId) {
    currentChatId = chatId;
    
    // UI güncelle
    document.querySelectorAll('.chat-item').forEach(item => {
        item.classList.remove('active');
    });
    event?.target?.closest('.chat-item')?.classList.add('active');

    // Mesajları yükle
    await loadChatMessages(chatId);
}

async function loadChatMessages(chatId) {
    const messagesContainer = document.getElementById('messagesContainer');
    messagesContainer.innerHTML = '<div class="loading">Yükleniyor</div>';

    try {
        const response = await fetch(`${BACKEND_URL}/api/chats/${chatId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            messagesContainer.innerHTML = '';

            if (data.messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="welcome-message">
                        <h2>Merhaba ${currentUser.username}!</h2>
                        <p>Size nasıl yardımcı olabilirim?</p>
                    </div>
                `;
            } else {
                data.messages.forEach(msg => {
                    addMessageToUI(msg.role, msg.content, msg.timestamp);
                });
            }

            scrollToBottom();
        }
    } catch (error) {
        console.error('Load messages error:', error);
        messagesContainer.innerHTML = '<div class="error">Mesajlar yüklenemedi</div>';
    }
}

async function createNewChat() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/chats`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'Yeni Sohbet' })
        });

        if (response.ok) {
            const data = await response.json();
            currentChatId = data.chat_id;
            await loadChats();
            
            // Yeni chat'i göster
            const messagesContainer = document.getElementById('messagesContainer');
            const fullName = currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Kullanıcı';
            messagesContainer.innerHTML = `
                <div class="welcome-message">
                    <h2>Merhaba ${fullName}!</h2>
                    <p>Size nasıl yardımcı olabilirim?</p>
                </div>
            `;
            
            // Input'a focus
            document.getElementById('messageInput').focus();
            
            // Mobile'da sidebar'ı kapat
            if (window.innerWidth <= 768) {
                closeSidebar();
            }
        }
    } catch (error) {
        console.error('Create chat error:', error);
        showNotification('Sohbet oluşturulamadı', 'error');
    }
}

function deleteChat(chatId) {
    chatToDelete = chatId;
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'block';
}

function closeDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.style.display = 'none';
    chatToDelete = null;
}

async function confirmDelete() {
    if (!chatToDelete) return;

    try {
        const response = await fetch(`${BACKEND_URL}/api/chats/${chatToDelete}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (response.ok) {
            closeDeleteModal();
            showNotification('Sohbet silindi', 'success');
            
            // Eğer silinen chat aktifse, yeni chat oluştur
            if (chatToDelete === currentChatId) {
                currentChatId = null;
                await loadChats();
            } else {
                await loadChats();
            }
        }
    } catch (error) {
        console.error('Delete chat error:', error);
        showNotification('Sohbet silinemedi', 'error');
    }
}

// ================== MESSAGING ==================
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    if (!currentChatId) {
        showNotification('Lütfen bir sohbet seçin', 'error');
        return;
    }

    // Input'u temizle
    messageInput.value = '';
    messageInput.style.height = 'auto';
    
    // Kullanıcı mesajını UI'a ekle
    addMessageToUI('user', message);
    
    // Typing indicator göster
    showTyping();

    // Send button'u devre dışı bırak
    const sendBtn = document.getElementById('sendBtn');
    sendBtn.disabled = true;
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/chat`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                chat_id: currentChatId
            })
        });

        const data = await response.json();
        
        hideTyping();
        sendBtn.disabled = false;
        
        if (response.ok) {
            // AI yanıtını UI'a ekle
            addMessageToUI('ai', data.response);
            
            // Chat listesini güncelle
            loadChats();
        } else {
            showNotification(data.error || 'Mesaj gönderilemedi', 'error');
        }
        
    } catch (error) {
        hideTyping();
        sendBtn.disabled = false;
        console.error('Send message error:', error);
        showNotification('Bağlantı hatası', 'error');
    }
}

function addMessageToUI(role, content, timestamp = null) {
    const messagesContainer = document.getElementById('messagesContainer');
    
    // Welcome message'ı kaldır
    const welcomeMessage = messagesContainer.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = timestamp 
        ? new Date(timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        : new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messageDiv.style.animation = 'messageSlide 0.4s ease';
    
    scrollToBottom();
}

// ================== UI HELPERS ==================
function showTyping() {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

function hideTyping() {
    const typingIndicator = document.getElementById('typingIndicator');
    typingIndicator.style.display = 'none';
}

function scrollToBottom() {
    const container = document.getElementById('messagesContainer');
    container.scrollTop = container.scrollHeight;
    
    setTimeout(() => {
        container.scrollTop = container.scrollHeight;
    }, 10);
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('show');
    overlay.classList.toggle('show');
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
}

// Şifre değiştirme
function openChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'block';
    
    // User menu'yu kapat
    document.getElementById('userMenu').classList.remove('show');
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    modal.style.display = 'none';
    
    // Formu temizle
    document.getElementById('oldPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('newPasswordConfirm').value = '';
}

async function handleChangePassword(event) {
    event.preventDefault();
    
    const oldPassword = document.getElementById('oldPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const newPasswordConfirm = document.getElementById('newPasswordConfirm').value;
    
    // Validasyon
    if (newPassword !== newPasswordConfirm) {
        showNotification('Yeni şifreler eşleşmiyor', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('Yeni şifre en az 6 karakter olmalıdır', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${BACKEND_URL}/api/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                old_password: oldPassword,
                new_password: newPassword
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Şifre başarıyla değiştirildi!', 'success');
            closeChangePasswordModal();
        } else {
            showNotification(data.error || 'Şifre değiştirilemedi', 'error');
        }
        
    } catch (error) {
        console.error('Change password error:', error);
        showNotification('Bağlantı hatası', 'error');
    }
}

// ================== UTILS ==================
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        return 'Bugün';
    } else if (days === 1) {
        return 'Dün';
    } else if (days < 7) {
        return `${days} gün önce`;
    } else {
        return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================== CODE COPY (from old script.js) ==================
window.copyCode = function(button) {
    const codeBlock = button.closest('.code-block');
    const originalCode = codeBlock.getAttribute('data-original-code');
    
    let text = originalCode;
    
    // HTML entity'leri decode et
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    text = text.replace(/<br>/g, '\n');
    text = text.trim();
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Kopyalandı!';
        button.classList.add('copied');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
        
        showNotification('Kod panoya kopyalandı!', 'success');
    }).catch(err => {
        console.error('Kopyalama hatası:', err);
        
        // Fallback
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        showNotification('Kod panoya kopyalandı!', 'success');
    });
};

// Modal close on outside click
window.onclick = function(event) {
    const deleteModal = document.getElementById('deleteModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    
    if (event.target === deleteModal) {
        closeDeleteModal();
    }
    
    if (event.target === changePasswordModal) {
        closeChangePasswordModal();
    }
}
