import os
from dotenv import load_dotenv

# Carga las variables de entorno desde el archivo .env
load_dotenv()

class Config:
    """
    Clase de configuración principal.
    Carga variables desde el entorno.
    """
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'demo-secret-key-for-portfolio-2024'
    
    # Para DEMO: Usar SQLite siempre (no requiere PostgreSQL)
    # Esto funciona en Vercel pero los datos son temporales
    SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/expenses.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'demo-jwt-secret-key-for-portfolio-2024'