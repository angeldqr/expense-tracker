from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Category
from app import db

# Creamos un Blueprint para las rutas de categorías
categories_bp = Blueprint('categories', __name__, url_prefix='/categories')

@categories_bp.route('/', methods=['POST'])
@jwt_required()
def create_category():
    # Obtenemos el ID del usuario desde el token
    current_user_id = get_jwt_identity()
    
    # Obtenemos los datos de la petición
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Falta el nombre de la categoría"}), 400

    name = data.get('name')

    # Verificamos si el usuario ya tiene una categoría con ese nombre
    if Category.query.filter_by(name=name, user_id=current_user_id).first():
        return jsonify({"error": "Ya tienes una categoría con este nombre"}), 409

    # Creamos la nueva categoría
    new_category = Category(name=name, user_id=current_user_id)

    # Guardamos en la base de datos
    db.session.add(new_category)
    db.session.commit()

    return jsonify({
        "message": "Categoría creada exitosamente",
        "category": {
            "id": new_category.id,
            "name": new_category.name
        }
    }), 201