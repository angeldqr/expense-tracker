# app/__init__.py
import os # <-- Importante: añadimos la librería 'os'
from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    # --- Diagnóstico de Ruta Absoluta ---
    # Obtenemos la ruta absoluta de la carpeta raíz del proyecto
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    # Construimos la ruta absoluta a la carpeta de templates
    TEMPLATE_FOLDER = os.path.join(PROJECT_ROOT, 'templates')
    
    # Creamos la aplicación, forzando la ubicación de la carpeta de templates
    app = Flask(__name__, template_folder=TEMPLATE_FOLDER)
    # ------------------------------------

    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # --- REGISTRO DE BLUEPRINTS ---
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)
    
    from .routes.transactions import transactions_bp
    app.register_blueprint(transactions_bp)
    
    from .routes.categories import categories_bp
    app.register_blueprint(categories_bp)
    
    # --- RUTA PRINCIPAL PARA EL FRONTEND ---
    @app.route('/')
    def index():
        return render_template('index.html')

    return app