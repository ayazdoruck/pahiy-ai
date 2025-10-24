"""
Configuration file
"""
import os

class Config:
    """Base configuration"""
    SECRET_KEY = os.environ.get("SECRET_KEY", "pahiy-ai-secret-key-change-in-production")
    GENAI_API_KEY = os.environ.get("GENAI_API_KEY")
    GENAI_MODEL = os.environ.get("GENAI_MODEL", "gemini-1.5-flash")
    ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
    PORT = int(os.environ.get("PORT", 5000))
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')
    
    # Database
    DATABASE_PATH = os.environ.get("DATABASE_PATH", "../pahiy_ai.db")
    
    # Rate Limiting
    RATE_LIMIT_ENABLED = True
    
    @staticmethod
    def is_production():
        return Config.ENVIRONMENT == "production"
    
    @staticmethod
    def is_development():
        return Config.ENVIRONMENT == "development"

