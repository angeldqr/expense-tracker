from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from app.models import User
from app import db, bcrypt

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# (Tu función de register se queda igual)
@auth_bp.route('/register', methods=['POST'])
def register():
    # ... código de registro sin cambios ...
    data = request.get_json()
    if not data or not data.get('name') or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Faltan nombre, email o contraseña"}), 400
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "El correo electrónico ya está registrado"}), 409
    new_user = User(name=data['name'], email=data['email'])
    new_user.set_password(data['password'])
    db.session.add(new_user)
    db.session.commit()
    return jsonify({"message": f"Usuario {data['name']} creado exitosamente"}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({"error": "Faltan email o contraseña"}), 400

    user = User.query.filter_by(email=data['email']).first()

    if user is None or not user.check_password(data['password']):
        return jsonify({"error": "Credenciales inválidas"}), 401

    # --- LA LÍNEA CORREGIDA ---
    # Convertimos el user.id a un string antes de crear el token.
    access_token = create_access_token(identity=str(user.id))
    
    return jsonify(access_token=access_token)