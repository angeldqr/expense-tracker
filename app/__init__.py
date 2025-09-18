from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import Config

# --- Inicialización de Extensiones ---
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

# --- Fábrica de Aplicaciones ---
def create_app(config_class=Config):
    """
    Función que crea y configura la aplicación Flask.
    """
    app = Flask(__name__)
    app.config.from_object(config_class)

    # --- Vinculación de Extensiones con la App ---
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # (Las rutas se registrarán aquí más adelante)

    return app