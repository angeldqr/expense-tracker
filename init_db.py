#!/usr/bin/env python3
"""
Script para inicializar la base de datos del Expense Tracker
Crea las tablas necesarias para la aplicación
"""

from app import create_app, db
from app.models import User, Category, Transaction

def init_database():
    """Inicializa la base de datos con las tablas necesarias"""
    app = create_app()
    
    with app.app_context():
        print("Creando tablas en la base de datos...")
        
        # Crear todas las tablas definidas en los modelos
        db.create_all()
        
        print("✅ Base de datos inicializada exitosamente")
        print("Tablas creadas:")
        print("- users (usuarios)")
        print("- categories (categorías)")
        print("- transactions (transacciones)")
        
        # Verificar que las tablas existen
        inspector = db.inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\nTablas en la base de datos: {tables}")

if __name__ == '__main__':
    init_database()