"""
Email sending service - Simple SMTP-free solution
For production, use Resend or SendGrid (both have free tiers)
"""

import os
import json

# For now, just log emails (console-based verification)
# In production, integrate with Resend (free 3000 emails/month)

# Railway'de otomatik URL alıyoruz
RAILWAY_PUBLIC_DOMAIN = os.environ.get('RAILWAY_PUBLIC_DOMAIN', '')
RAILWAY_STATIC_URL = os.environ.get('RAILWAY_STATIC_URL', '')

# Frontend URL'i belirle
if RAILWAY_PUBLIC_DOMAIN:
    FRONTEND_URL = f"https://{RAILWAY_PUBLIC_DOMAIN}"
elif RAILWAY_STATIC_URL:
    FRONTEND_URL = RAILWAY_STATIC_URL
else:
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5000')

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

def send_verification_email(email: str, username: str, token: str) -> bool:
    """
    Email doğrulama linki gönder
    
    Development: Console'a yaz
    Production: Resend veya SendGrid kullan
    """
    verification_link = f"{FRONTEND_URL}/api/verify-email/{token}"
    
    # Resend API key varsa gerçek email gönder
    resend_key = os.environ.get("RESEND_API_KEY")
    
    if resend_key:
        # Production: Resend ile gerçek email gönder
        try:
            import resend
            resend.api_key = resend_key
            
            resend.Emails.send({
                "from": "Pahiy AI <noreply@dockie.site>",
                "to": email,
                "subject": "Pahiy AI - Email Doğrulama",
                "html": f"""
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <style>
                            body {{ font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #fff; background: #000; margin: 0; padding: 0; }}
                            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                            .header {{ background: #111; color: #fff; padding: 30px 20px; text-align: center; border-radius: 12px 12px 0 0; }}
                            .content {{ padding: 30px 20px; background: #0a0a0a; border-left: 1px solid #333; border-right: 1px solid #333; }}
                            .button {{ display: inline-block; padding: 14px 32px; background: #fff; color: #000; text-decoration: none; border-radius: 8px; margin: 25px 0; font-weight: 600; }}
                            .footer {{ padding: 20px; background: #111; text-align: center; color: #666; font-size: 13px; border-radius: 0 0 12px 12px; }}
                            .link {{ color: #888; word-break: break-all; font-size: 12px; }}
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="header">
                                <h1 style="margin: 0; font-size: 32px;">🤖 Pahiy AI</h1>
                            </div>
                            <div class="content">
                                <h2 style="color: #fff; margin-top: 0;">Merhaba {username}!</h2>
                                <p style="color: #e5e5e5;">Pahiy AI'a hoş geldiniz! 🎉</p>
                                <p style="color: #e5e5e5;">Hesabınızı doğrulamak ve sohbete başlamak için aşağıdaki butona tıklayın:</p>
                                <div style="text-align: center;">
                                    <a href="{verification_link}" class="button">Email Adresimi Doğrula</a>
                                </div>
                                <p style="color: #999; font-size: 13px; margin-top: 30px;">Veya bu linki tarayıcınıza kopyalayın:</p>
                                <p class="link">{verification_link}</p>
                            </div>
                            <div class="footer">
                                <p style="margin: 0;">Bu link 24 saat geçerlidir.</p>
                                <p style="margin: 10px 0 0 0;">Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</p>
                            </div>
                        </div>
                    </body>
                    </html>
                """
            })
            print(f"✅ Verification email sent to {email}")
            return True
        except Exception as e:
            print(f"❌ Email send error: {e}")
            print(f"📧 Fallback - Verification link: {verification_link}")
            return False
    else:
        # Development: Console'a yaz
        print("\n" + "="*60)
        print("📧 EMAIL VERIFICATION")
        print("="*60)
        print(f"To: {email}")
        print(f"Subject: Pahiy AI - Email Doğrulama")
        print("-"*60)
        print(f"Merhaba {username},\n")
        print(f"Hesabınızı doğrulamak için aşağıdaki linke tıklayın:\n")
        print(f"🔗 {verification_link}\n")
        print(f"Bu link 24 saat geçerlidir.")
        print("="*60 + "\n")
        return True

def send_email_with_resend(email: str, username: str, token: str) -> bool:
    """
    Resend ile email gönder (Production için)
    
    Setup:
    1. https://resend.com → Sign up (ücretsiz)
    2. API Key al
    3. Environment variable: RESEND_API_KEY=your_key
    4. pip install resend
    """
    try:
        import resend
        
        resend.api_key = os.environ.get("RESEND_API_KEY")
        verification_link = f"{FRONTEND_URL}/api/verify-email/{token}"
        
        resend.Emails.send({
            "from": "Pahiy AI <onboarding@resend.dev>",  # Resend test email
            "to": email,
            "subject": "Pahiy AI - Email Doğrulama",
            "html": f"""
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                        .header {{ background: #000; color: #fff; padding: 20px; text-align: center; }}
                        .content {{ padding: 20px; background: #f4f4f4; }}
                        .button {{ display: inline-block; padding: 12px 30px; background: #fff; color: #000; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🤖 Pahiy AI</h1>
                        </div>
                        <div class="content">
                            <h2>Merhaba {username}!</h2>
                            <p>Pahiy AI'a hoş geldiniz! 🎉</p>
                            <p>Hesabınızı doğrulamak için aşağıdaki butona tıklayın:</p>
                            <a href="{verification_link}" class="button">Email Adresimi Doğrula</a>
                            <p>Veya bu linki tarayıcınıza kopyalayın:</p>
                            <p style="word-break: break-all; color: #666;">{verification_link}</p>
                            <p><small>Bu link 24 saat geçerlidir. Eğer bu işlemi siz yapmadıysanız, bu emaili görmezden gelebilirsiniz.</small></p>
                        </div>
                    </div>
                </body>
                </html>
            """
        })
        return True
    except Exception as e:
        print(f"❌ Email gönderme hatası: {e}")
        return False

