from app import create_app
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

# Crear la aplicación
app = create_app()

# Vercel necesita que la aplicación esté disponible en el nivel del módulo
# No uses if __name__ == '__main__' para Vercel

if __name__ == '__main__':
    # Solo para desarrollo local
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('FLASK_PORT', 5000))
    
    app.run(
        debug=debug_mode,
        host='127.0.0.1',
        port=port
    )