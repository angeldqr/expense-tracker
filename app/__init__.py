import os
from flask import Flask, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app(config_class=Config):
    PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    TEMPLATE_FOLDER = os.path.join(PROJECT_ROOT, 'templates')

    app = Flask(__name__, template_folder=TEMPLATE_FOLDER)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Configurar CORS para permitir requests desde cualquier origen
    CORS(app, resources={r"/*": {"origins": "*"}})

    # --- REGISTRO DE BLUEPRINTS ---
    from .routes.auth import auth_bp
    app.register_blueprint(auth_bp)

    from .routes.transactions import transactions_bp
    app.register_blueprint(transactions_bp)

    from .routes.categories import categories_bp
    app.register_blueprint(categories_bp)

    # NUEVO BLUEPRINT DE ESTADÍSTICAS
    from .routes.stats import stats_bp
    app.register_blueprint(stats_bp)

    # BLUEPRINT DE DEMO
    from .routes.demo import demo_bp
    app.register_blueprint(demo_bp)

    # --- RUTA PRINCIPAL PARA EL FRONTEND ---
    @app.route('/')
    def index():
        return render_template('index.html')

    return app