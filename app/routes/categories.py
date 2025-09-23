from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Category, Transaction
from app import db

categories_bp = Blueprint('categories', __name__, url_prefix='/categories')

# =============================================
# Rutas para la colección de categorías ('/')
# =============================================

@categories_bp.route('/', methods=['GET'])
@jwt_required()
def get_categories():
    """Obtiene una lista de todas las categorías del usuario logueado."""
    current_user_id = get_jwt_identity()
    categories = Category.query.filter_by(user_id=current_user_id).order_by(Category.name).all()
    
    result = [{'id': cat.id, 'name': cat.name} for cat in categories]
    return jsonify(result)

@categories_bp.route('/', methods=['POST'])
@jwt_required()
def create_category():
    """Crea una nueva categoría para el usuario logueado."""
    current_user_id = get_jwt_identity()
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Falta el nombre de la categoría"}), 400

    name = data.get('name').strip()
    if not name:
        return jsonify({"error": "El nombre no puede estar vacío"}), 400

    if Category.query.filter_by(name=name, user_id=current_user_id).first():
        return jsonify({"error": "Ya tienes una categoría con este nombre"}), 409

    new_category = Category(name=name, user_id=current_user_id)
    db.session.add(new_category)
    db.session.commit()

    return jsonify({
        "message": "Categoría creada exitosamente",
        "category": {"id": new_category.id, "name": new_category.name}
    }), 201

# ==============================================================
# Rutas para una categoría específica ('/<int:category_id>')
# ==============================================================

@categories_bp.route('/<int:category_id>', methods=['PUT'])
@jwt_required()
def update_category(category_id):
    """Actualiza el nombre de una categoría existente."""
    current_user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
    
    if not category:
        return jsonify({"error": "Categoría no encontrada"}), 404
    
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({"error": "Falta el nuevo nombre de la categoría"}), 400
    
    new_name = data.get('name').strip()
    if not new_name:
        return jsonify({"error": "El nombre no puede estar vacío"}), 400

    # Verifica si ya existe otra categoría con el nuevo nombre
    existing_category = Category.query.filter(Category.id != category_id, Category.name == new_name, Category.user_id == current_user_id).first()
    if existing_category:
        return jsonify({"error": "Ya tienes otra categoría con ese nombre"}), 409
        
    category.name = new_name
    db.session.commit()
    
    return jsonify({"message": "Categoría actualizada exitosamente"})

@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@jwt_required()
def delete_category(category_id):
    """Elimina una categoría existente."""
    current_user_id = get_jwt_identity()
    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()

    if not category:
        return jsonify({"error": "Categoría no encontrada"}), 404

    # REGLA DE SEGURIDAD: Verifica si hay transacciones usando esta categoría
    if Transaction.query.filter_by(category_id=category.id).first():
        return jsonify({"error": "No se puede eliminar la categoría porque tiene transacciones asociadas"}), 409
        
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({"message": "Categoría eliminada exitosamente"})