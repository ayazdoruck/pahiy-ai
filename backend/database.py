import sqlite3
import json
from datetime import datetime
import hashlib
import secrets
from typing import Optional, List, Dict

class Database:
    def __init__(self, db_path='pahiy_ai.db'):
        self.db_path = db_path
        self.init_db()
    
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn
    
    def init_db(self):
        """Veritabanı tablolarını oluştur"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Kullanıcılar tablosu
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                first_name TEXT NOT NULL,
                last_name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP
            )
        ''')
        
        # Chatler tablosu
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        # Mesajlar tablosu
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                chat_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
            )
        ''')
        
        # Oturum tokenleri tablosu
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        ''')
        
        conn.commit()
        conn.close()
    
    # ========== KULLANICI İŞLEMLERİ ==========
    
    def hash_password(self, password: str) -> str:
        """Şifreyi hash'le"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def create_user(self, first_name: str, last_name: str, username: str, email: str, password: str) -> Optional[int]:
        """Yeni kullanıcı oluştur"""
        try:
            conn = self.get_connection()
            cursor = conn.cursor()
            password_hash = self.hash_password(password)
            
            cursor.execute('''
                INSERT INTO users (first_name, last_name, username, email, password_hash)
                VALUES (?, ?, ?, ?, ?)
            ''', (first_name, last_name, username, email, password_hash))
            
            user_id = cursor.lastrowid
            conn.commit()
            conn.close()
            return user_id
        except sqlite3.IntegrityError:
            return None
    
    def verify_user(self, login: str, password: str) -> Optional[Dict]:
        """Kullanıcı giriş doğrulama (email veya username ile)"""
        conn = self.get_connection()
        cursor = conn.cursor()
        password_hash = self.hash_password(password)
        
        # Email veya username ile giriş
        cursor.execute('''
            SELECT id, first_name, last_name, username, email FROM users 
            WHERE (email = ? OR username = ?) AND password_hash = ?
        ''', (login, login, password_hash))
        
        row = cursor.fetchone()
        
        if row:
            # Son giriş zamanını güncelle
            cursor.execute('''
                UPDATE users SET last_login = CURRENT_TIMESTAMP
                WHERE id = ?
            ''', (row['id'],))
            conn.commit()
            
            user = dict(row)
            conn.close()
            return user
        
        conn.close()
        return None
    
    def get_user_by_id(self, user_id: int) -> Optional[Dict]:
        """ID'ye göre kullanıcı getir"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, first_name, last_name, username, email, created_at, last_login 
            FROM users WHERE id = ?
        ''', (user_id,))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def change_password(self, user_id: int, old_password: str, new_password: str) -> bool:
        """Kullanıcı şifresini değiştir"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # Eski şifreyi doğrula
        old_hash = self.hash_password(old_password)
        cursor.execute('''
            SELECT id FROM users 
            WHERE id = ? AND password_hash = ?
        ''', (user_id, old_hash))
        
        if not cursor.fetchone():
            conn.close()
            return False
        
        # Yeni şifreyi kaydet
        new_hash = self.hash_password(new_password)
        cursor.execute('''
            UPDATE users SET password_hash = ?
            WHERE id = ?
        ''', (new_hash, user_id))
        
        conn.commit()
        conn.close()
        return True
    
    # ========== OTURUM İŞLEMLERİ ==========
    
    def create_session(self, user_id: int) -> str:
        """Yeni oturum oluştur"""
        token = secrets.token_urlsafe(32)
        conn = self.get_connection()
        cursor = conn.cursor()
        
        # 30 gün geçerli
        cursor.execute('''
            INSERT INTO sessions (token, user_id, expires_at)
            VALUES (?, ?, datetime('now', '+30 days'))
        ''', (token, user_id))
        
        conn.commit()
        conn.close()
        return token
    
    def verify_session(self, token: str) -> Optional[int]:
        """Oturum token'ını doğrula"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT user_id FROM sessions 
            WHERE token = ? AND expires_at > datetime('now')
        ''', (token,))
        
        row = cursor.fetchone()
        conn.close()
        
        return row['user_id'] if row else None
    
    def delete_session(self, token: str):
        """Oturumu sonlandır"""
        conn = self.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
        conn.commit()
        conn.close()
    
    # ========== CHAT İŞLEMLERİ ==========
    
    def create_chat(self, user_id: int, title: str = "Yeni Sohbet") -> str:
        """Yeni chat oluştur"""
        chat_id = secrets.token_urlsafe(16)
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO chats (id, user_id, title)
            VALUES (?, ?, ?)
        ''', (chat_id, user_id, title))
        
        conn.commit()
        conn.close()
        return chat_id
    
    def get_user_chats(self, user_id: int) -> List[Dict]:
        """Kullanıcının tüm chatlerini getir"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, created_at, updated_at 
            FROM chats 
            WHERE user_id = ?
            ORDER BY updated_at DESC
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_chat(self, chat_id: str, user_id: int) -> Optional[Dict]:
        """Belirli bir chat'i getir"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, title, created_at, updated_at 
            FROM chats 
            WHERE id = ? AND user_id = ?
        ''', (chat_id, user_id))
        
        row = cursor.fetchone()
        conn.close()
        
        return dict(row) if row else None
    
    def update_chat_title(self, chat_id: str, user_id: int, title: str):
        """Chat başlığını güncelle"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE chats 
            SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND user_id = ?
        ''', (title, chat_id, user_id))
        
        conn.commit()
        conn.close()
    
    def delete_chat(self, chat_id: str, user_id: int):
        """Chat'i sil"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM chats 
            WHERE id = ? AND user_id = ?
        ''', (chat_id, user_id))
        
        conn.commit()
        conn.close()
    
    def update_chat_timestamp(self, chat_id: str):
        """Chat'in son güncelleme zamanını güncelle"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE chats 
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        ''', (chat_id,))
        
        conn.commit()
        conn.close()
    
    # ========== MESAJ İŞLEMLERİ ==========
    
    def add_message(self, chat_id: str, role: str, content: str):
        """Chat'e mesaj ekle"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO messages (chat_id, role, content)
            VALUES (?, ?, ?)
        ''', (chat_id, role, content))
        
        conn.commit()
        conn.close()
        
        # Chat'in güncelleme zamanını güncelle
        self.update_chat_timestamp(chat_id)
    
    def get_chat_messages(self, chat_id: str, limit: int = 100) -> List[Dict]:
        """Chat'in mesajlarını getir"""
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT role, content, timestamp 
            FROM messages 
            WHERE chat_id = ?
            ORDER BY timestamp ASC
            LIMIT ?
        ''', (chat_id, limit))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def clear_chat_messages(self, chat_id: str, user_id: int):
        """Chat'in tüm mesajlarını temizle"""
        # Önce chat'in kullanıcıya ait olduğunu doğrula
        chat = self.get_chat(chat_id, user_id)
        if not chat:
            return
        
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM messages WHERE chat_id = ?', (chat_id,))
        
        conn.commit()
        conn.close()

