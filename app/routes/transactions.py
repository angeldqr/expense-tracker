from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction, Category
from app import db

transactions_bp = Blueprint('transactions', __name__, url_prefix='/transactions')

@transactions_bp.route('/', methods=['POST'])
@jwt_required()
def create_transaction():
    # 1. Obtenemos el ID del usuario desde el token JWT.
    current_user_id = get_jwt_identity()
    
    # 2. Obtenemos los datos de la petición.
    data = request.get_json()
    if not data:
        return jsonify({"error": "No se proporcionaron datos"}), 400

    description = data.get('description')
    amount = data.get('amount')
    type = data.get('type')
    category_id = data.get('category_id')
    
    # 3. Validamos los datos recibidos.
    if not all([description, amount, type, category_id]):
        return jsonify({"error": "Faltan datos requeridos"}), 400
    
    if type not in ['income', 'expense']:
        return jsonify({"error": "El tipo debe ser 'income' o 'expense'"}), 400

    try:
        amount = float(amount)
        if amount <= 0:
            raise ValueError
    except ValueError:
        return jsonify({"error": "El monto debe ser un número positivo"}), 400

    # 4. Verificamos que la categoría exista y pertenezca al usuario.
    category = Category.query.filter_by(id=category_id, user_id=current_user_id).first()
    if not category:
        return jsonify({"error": "La categoría no existe o no te pertenece"}), 404

    # 5. Creamos la nueva transacción.
    new_transaction = Transaction(
        description=description,
        amount=amount,
        type=type,
        category_id=category_id,
        user_id=current_user_id
    )

    # 6. Guardamos en la base de datos.
    db.session.add(new_transaction)
    db.session.commit()

    return jsonify({"message": "Transacción creada exitosamente"}), 201