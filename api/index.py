"""
WSGI entry point for Vercel deployment
"""
from app import create_app, db

# Create the Flask application
app = create_app()

# Crear las tablas automáticamente en el primer request
with app.app_context():
    try:
        db.create_all()
        print("✅ Tablas creadas/verificadas")
    except Exception as e:
        print(f"⚠️ Error al crear tablas: {e}")

# This is what Vercel will use
if __name__ == "__main__":
    app.run()
