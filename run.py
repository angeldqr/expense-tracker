from app import create_app
from dotenv import load_dotenv
import os

# Cargar variables de entorno
load_dotenv()

app = create_app()

if __name__ == '__main__':
    # Obtener configuración desde variables de entorno
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    port = int(os.getenv('FLASK_PORT', 5000))
    
    app.run(
        debug=debug_mode,
        host='127.0.0.1',
        port=port
    )

app = create_app()

if __name__ == '__main__':
    app.run(debug=False)