from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction, Category
from app import db
from sqlalchemy.orm import joinedload
from datetime import datetime, date

transactions_bp = Blueprint('transactions', __name__, url_prefix='/transactions')

# =============================================
# Rutas para la colección de transacciones ('/')
# =============================================

@transactions_bp.route('/', methods=['GET'])
@jwt_required()
def get_transactions():
    """Obtiene una lista de todas las transacciones del usuario logueado."""
    current_user_id = get_jwt_identity()
    
    # Carga las transacciones con su categoría asociada
    user_transactions = Transaction.query.filter_by(user_id=current_user_id).options(
        joinedload(Transaction.category)
    ).order_by(Transaction.transaction_date.desc()).all()
    
    result = []
    for t in user_transactions:
        category_name = t.category.name if t.category else 'Sin categoría'
        result.append({
            'id': t.id,
            'description': t.description,
            'amount': str(t.amount),
            'type': t.type,
            'category_id': t.category_id,
            'category_name': category_name,
            'transaction_date': t.transaction_date.isoformat(),  # Fecha real de la transacción
            'transaction_month': t.transaction_month,  # Mes de la transacción
            'date': t.date.isoformat()  # Fecha de registro
        })
    return jsonify(result)

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    """Crea una nueva transacción para el usuario logueado."""
    try:
        current_user_id = int(get_jwt_identity())
        data = request.get_json()

        # Validación de datos requeridos
        if not data or not all(k in data for k in ['description', 'amount', 'type', 'category_id']):
            return jsonify({"error": "Faltan datos requeridos"}), 400
        
        if data['type'] not in ['income', 'expense']:
            return jsonify({"error": "El tipo debe ser 'income' o 'expense'"}), 400

        try:
            amount = float(data['amount'])
            if amount <= 0: 
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({"error": "El monto debe ser un número positivo"}), 400

        # Verificar que la categoría pertenece al usuario
        category_id = int(data.get('category_id'))
        category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
        if not category:
            return jsonify({"error": "La categoría no existe o no te pertenece"}), 404
        
        # Manejar fecha de transacción
        transaction_date_str = data.get('transaction_date')
        if transaction_date_str:
            try:
                # Convertir string a objeto date
                transaction_date = datetime.strptime(transaction_date_str, '%Y-%m-%d').date()
            except ValueError:
                return jsonify({"error": "Formato de fecha inválido. Use YYYY-MM-DD"}), 400
        else:
            # Si no se proporciona, usar la fecha actual
            transaction_date = date.today()
        
        # Calcular el mes de transacción (YYYY-MM)
        transaction_month = transaction_date.strftime('%Y-%m')
        
        # Crear nueva transacción
        new_transaction = Transaction(
            description=data['description'],
            amount=amount,
            type=data['type'],
            category_id=category.id,
            user_id=current_user_id,
            transaction_date=transaction_date,
            transaction_month=transaction_month,
            date=datetime.combine(transaction_date, datetime.min.time())  # Para compatibilidad
        )
        
        db.session.add(new_transaction)
        db.session.commit()
        
        return jsonify({
            "message": "Transacción creada exitosamente",
            "transaction": {
                "id": new_transaction.id,
                "description": new_transaction.description,
                "amount": float(new_transaction.amount),
                "type": new_transaction.type,
                "transaction_date": new_transaction.transaction_date.isoformat(),
                "transaction_month": new_transaction.transaction_month,
                "category_id": new_transaction.category_id,
                "category_name": category.name
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al crear la transacción: {str(e)}"}), 500

# ==============================================================
# Rutas para una transacción específica ('/<int:transaction_id>')
# ==============================================================

@transactions_bp.route('/<int:transaction_id>', methods=['GET'])
@jwt_required()
def get_transaction(transaction_id):
    """Obtiene los detalles de una transacción específica."""
    current_user_id = int(get_jwt_identity())
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id).first()
    
    if not transaction:
        return jsonify({"error": "Transacción no encontrada"}), 404
    
    category_name = transaction.category.name if transaction.category else 'Sin categoría'
    
    return jsonify({
        'id': transaction.id,
        'description': transaction.description,
        'amount': str(transaction.amount),
        'type': transaction.type,
        'category_id': transaction.category_id,
        'category_name': category_name,
        'transaction_date': transaction.transaction_date.isoformat(),  # Fecha real de la transacción
        'transaction_month': transaction.transaction_month,  # Mes de la transacción
        'date': transaction.date.isoformat()  # Fecha de registro
    })

@transactions_bp.route('/<int:transaction_id>', methods=['PUT'])
@jwt_required()
def update_transaction(transaction_id):
    """Actualiza una transacción existente."""
    try:
        current_user_id = int(get_jwt_identity())
        transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id).first()

        if not transaction:
            return jsonify({"error": "Transacción no encontrada"}), 404
            
        data = request.get_json()
        
        # Actualizar campos básicos
        if 'description' in data:
            transaction.description = data['description']
        if 'amount' in data:
            try:
                amount = float(data['amount'])
                if amount <= 0:
                    return jsonify({"error": "El monto debe ser mayor a 0"}), 400
                transaction.amount = amount
            except (ValueError, TypeError):
                return jsonify({"error": "El monto debe ser un número válido"}), 400
        if 'type' in data:
            if data['type'] not in ['income', 'expense']:
                return jsonify({"error": "El tipo debe ser 'income' o 'expense'"}), 400
            transaction.type = data['type']
        if 'category_id' in data:
            # Verificar que la categoría pertenece al usuario
            category = Category.query.filter_by(id=data['category_id'], user_id=current_user_id).first()
            if not category:
                return jsonify({"error": "La categoría no existe o no te pertenece"}), 404
            transaction.category_id = data['category_id']
        
        # Actualizar fecha si se proporciona
        if 'transaction_date' in data and data['transaction_date']:
            try:
                transaction_date = datetime.strptime(data['transaction_date'], '%Y-%m-%d').date()
                transaction.transaction_date = transaction_date
                transaction.transaction_month = transaction_date.strftime('%Y-%m')
                transaction.date = datetime.combine(transaction_date, datetime.min.time())
            except ValueError:
                return jsonify({"error": "Formato de fecha inválido. Use YYYY-MM-DD"}), 400
        
        db.session.commit()
        
        # Obtener el nombre de la categoría actualizada
        category = Category.query.get(transaction.category_id)
        
        return jsonify({
            "message": "Transacción actualizada exitosamente",
            "transaction": {
                "id": transaction.id,
                "description": transaction.description,
                "amount": float(transaction.amount),
                "type": transaction.type,
                "transaction_date": transaction.transaction_date.isoformat(),
                "transaction_month": transaction.transaction_month,
                "category_id": transaction.category_id,
                "category_name": category.name if category else 'Sin categoría'
            }
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al actualizar la transacción: {str(e)}"}), 500

@transactions_bp.route('/<int:transaction_id>', methods=['DELETE'])
@jwt_required()
def delete_transaction(transaction_id):
    """Elimina una transacción existente."""
    current_user_id = int(get_jwt_identity())
    transaction = Transaction.query.filter_by(id=transaction_id, user_id=current_user_id).first()
    
    if not transaction:
        return jsonify({"error": "Transacción no encontrada"}), 404
        
    db.session.delete(transaction)
    db.session.commit()
    return jsonify({"message": "Transacción eliminada exitosamente"})