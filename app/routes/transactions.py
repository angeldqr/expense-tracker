from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction, Category
from app import db

transactions_bp = Blueprint('transactions', __name__, url_prefix='/transactions')

# =============================================
# Rutas para la colección de transacciones ('/')
# =============================================

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    """Obtiene una lista de todas las transacciones del usuario logueado."""
    current_user_id = get_jwt_identity()
    user_transactions = Transaction.query.filter_by(user_id=current_user_id).order_by(Transaction.date.desc()).all()
    
    result = []
    for t in user_transactions:
        result.append({
            'id': t.id,
            'description': t.description,
            'amount': str(t.amount),
            'type': t.type,
            'category_id': t.category_id,
            'date': t.date.isoformat()
        })
    return jsonify(result)

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    """Crea una nueva transacción para el usuario logueado."""
    current_user_id = get_jwt_identity()
    data = request.get_json()

    if not data or not all(k in data for k in ['description', 'amount', 'type', 'category_id']):
        return jsonify({"error": "Faltan datos requeridos"}), 400
    
    if data['type'] not in ['income', 'expense']:
        return jsonify({"error": "El tipo debe ser 'income' o 'expense'"}), 400

    try:
        amount = float(data['amount'])
        if amount <= 0: raise ValueError
    except (ValueError, TypeError):
        return jsonify({"error": "El monto debe ser un número positivo"}), 400

    category = Category.query.filter_by(id=data['category_id'], user_id=current_user_id).first()
    if not category:
        return jsonify({"error": "La categoría no existe o no te pertenece"}), 404
    
    new_transaction = Transaction(
        description=data['description'],
        amount=amount,
        type=data['type'],
        category_id=data['category_id'],
        user_id=current_user_id
    )
    db.session.add(new_transaction)
    db.session.commit()
    return jsonify({"message": "Transacción creada exitosamente"}), 201

# ==============================================================
# Rutas para una transacción específica ('/<int:transaction_id>')
# ==============================================================

@transactions_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """Obtiene los detalles de una transacción específica."""
    current_user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id).first()
    
    if not transaction:
        return jsonify({"error": "Transacción no encontrada"}), 404
    
    return jsonify({
        'id': transaction.id,
        'description': transaction.description,
        'amount': str(transaction.amount),
        'type': transaction.type,
        'category_id': transaction.category_id,
        'date': transaction.date.isoformat()
    })

@transactions_bp.route('/<int:transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    """Actualiza una transacción existente."""
    current_user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id).first()

    if not transaction:
        return jsonify({"error": "Transacción no encontrada"}), 404
        
    data = request.get_json()
    transaction.description = data.get('description', transaction.description)
    transaction.amount = data.get('amount', transaction.amount)
    transaction.type = data.get('type', transaction.type)
    transaction.category_id = data.get('category_id', transaction.category_id)
    
    db.session.commit()
    return jsonify({"message": "Transacción actualizada exitosamente"})

@transactions_bp.route('/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    """Elimina una transacción existente."""
    current_user_id = get_jwt_identity()
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id).first()
    
    if not transaction:
        return jsonify({"error": "Transacción no encontrada"}), 404
        
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transacción eliminada exitosamente"})