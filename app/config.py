import os
from datetime import timedelta

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Configuración base de la aplicación"""
    
    # Claves secretas desde variables de entorno
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key-change-in-production')
    
    # Base de datos
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', f'sqlite:///{os.path.join(basedir, "expenses.db")}')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # App info
    APP_NAME = os.getenv('APP_NAME', 'Expense Tracker')
    APP_VERSION = os.getenv('APP_VERSION', '1.0.0')