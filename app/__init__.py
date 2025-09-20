from flask import Flask, jsonify
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
    app = Flask(__name__)
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

    return app