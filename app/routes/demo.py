from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token
from app.models import User, Category, Transaction
from app import db, bcrypt
from datetime import datetime, date, timedelta
from decimal import Decimal

demo_bp = Blueprint('demo', __name__, url_prefix='/demo')

DEMO_EMAIL = 'demo@expense-tracker.com'
DEMO_NAME = 'Usuario Demo'
DEMO_PASSWORD = 'demo123'

def create_demo_user():
    """Crea o actualiza el usuario demo con datos de ejemplo"""
    # Buscar si ya existe el usuario demo
    demo_user = User.query.filter_by(email=DEMO_EMAIL).first()
    
    if not demo_user:
        # Crear nuevo usuario demo
        demo_user = User(name=DEMO_NAME, email=DEMO_EMAIL)
        demo_user.set_password(DEMO_PASSWORD)
        db.session.add(demo_user)
        db.session.commit()
    
    # Limpiar datos antiguos del usuario demo
    Transaction.query.filter_by(user_id=demo_user.id).delete()
    Category.query.filter_by(user_id=demo_user.id).delete()
    db.session.commit()
    
    # Crear categorías de ejemplo
    categories_data = [
        'Alimentación',
        'Transporte',
        'Vivienda',
        'Entretenimiento',
        'Salud',
        'Educación',
        'Salario',
        'Inversiones',
        'Otros'
    ]
    
    categories = {}
    for cat_name in categories_data:
        category = Category(name=cat_name, user_id=demo_user.id)
        db.session.add(category)
        db.session.flush()  # Para obtener el ID
        categories[cat_name] = category.id
    
    db.session.commit()
    
    # Crear transacciones de ejemplo (últimos 3 meses)
    today = date.today()
    transactions_data = []
    
    # Mes actual
    current_month = today.strftime('%Y-%m')
    transactions_data.extend([
        # Ingresos
        {'description': 'Salario mensual', 'amount': Decimal('3500.00'), 'type': 'income', 
         'category': 'Salario', 'date': today - timedelta(days=5)},
        {'description': 'Freelance - Desarrollo web', 'amount': Decimal('800.00'), 'type': 'income', 
         'category': 'Otros', 'date': today - timedelta(days=3)},
        
        # Gastos
        {'description': 'Supermercado Walmart', 'amount': Decimal('156.50'), 'type': 'expense', 
         'category': 'Alimentación', 'date': today - timedelta(days=2)},
        {'description': 'Netflix - Suscripción', 'amount': Decimal('15.99'), 'type': 'expense', 
         'category': 'Entretenimiento', 'date': today - timedelta(days=1)},
        {'description': 'Gasolina', 'amount': Decimal('45.00'), 'type': 'expense', 
         'category': 'Transporte', 'date': today},
        {'description': 'Alquiler apartamento', 'amount': Decimal('850.00'), 'type': 'expense', 
         'category': 'Vivienda', 'date': today - timedelta(days=4)},
        {'description': 'Cena restaurante', 'amount': Decimal('67.80'), 'type': 'expense', 
         'category': 'Alimentación', 'date': today - timedelta(days=6)},
    ])
    
    # Mes anterior
    last_month_date = today.replace(day=1) - timedelta(days=1)
    last_month = last_month_date.strftime('%Y-%m')
    transactions_data.extend([
        {'description': 'Salario mensual', 'amount': Decimal('3500.00'), 'type': 'income', 
         'category': 'Salario', 'date': last_month_date.replace(day=5)},
        {'description': 'Venta artículos usados', 'amount': Decimal('200.00'), 'type': 'income', 
         'category': 'Otros', 'date': last_month_date.replace(day=15)},
        
        {'description': 'Supermercado', 'amount': Decimal('450.00'), 'type': 'expense', 
         'category': 'Alimentación', 'date': last_month_date.replace(day=10)},
        {'description': 'Alquiler apartamento', 'amount': Decimal('850.00'), 'type': 'expense', 
         'category': 'Vivienda', 'date': last_month_date.replace(day=3)},
        {'description': 'Electricidad', 'amount': Decimal('85.50'), 'type': 'expense', 
         'category': 'Vivienda', 'date': last_month_date.replace(day=12)},
        {'description': 'Internet', 'amount': Decimal('45.00'), 'type': 'expense', 
         'category': 'Vivienda', 'date': last_month_date.replace(day=15)},
        {'description': 'Gasolina', 'amount': Decimal('120.00'), 'type': 'expense', 
         'category': 'Transporte', 'date': last_month_date.replace(day=20)},
        {'description': 'Gimnasio - Mensualidad', 'amount': Decimal('50.00'), 'type': 'expense', 
         'category': 'Salud', 'date': last_month_date.replace(day=8)},
        {'description': 'Cine', 'amount': Decimal('25.00'), 'type': 'expense', 
         'category': 'Entretenimiento', 'date': last_month_date.replace(day=18)},
    ])
    
    # Hace dos meses
    two_months_ago = last_month_date.replace(day=1) - timedelta(days=1)
    two_months_str = two_months_ago.strftime('%Y-%m')
    transactions_data.extend([
        {'description': 'Salario mensual', 'amount': Decimal('3500.00'), 'type': 'income', 
         'category': 'Salario', 'date': two_months_ago.replace(day=5)},
        
        {'description': 'Supermercado', 'amount': Decimal('380.00'), 'type': 'expense', 
         'category': 'Alimentación', 'date': two_months_ago.replace(day=8)},
        {'description': 'Alquiler apartamento', 'amount': Decimal('850.00'), 'type': 'expense', 
         'category': 'Vivienda', 'date': two_months_ago.replace(day=3)},
        {'description': 'Curso online', 'amount': Decimal('150.00'), 'type': 'expense', 
         'category': 'Educación', 'date': two_months_ago.replace(day=12)},
        {'description': 'Gasolina', 'amount': Decimal('100.00'), 'type': 'expense', 
         'category': 'Transporte', 'date': two_months_ago.replace(day=15)},
    ])
    
    # Crear las transacciones
    for trans_data in transactions_data:
        transaction = Transaction(
            description=trans_data['description'],
            amount=trans_data['amount'],
            type=trans_data['type'],
            transaction_date=trans_data['date'],
            transaction_month=trans_data['date'].strftime('%Y-%m'),
            date=datetime.combine(trans_data['date'], datetime.min.time()),
            user_id=demo_user.id,
            category_id=categories[trans_data['category']]
        )
        db.session.add(transaction)
    
    db.session.commit()
    return demo_user


@demo_bp.route('/access', methods=['GET', 'POST'])
def demo_access():
    """
    Endpoint para obtener acceso demo sin autenticación.
    Crea/actualiza el usuario demo con datos de ejemplo y devuelve un token.
    """
    try:
        # Crear o actualizar usuario demo con datos
        demo_user = create_demo_user()
        
        # Generar token de acceso
        access_token = create_access_token(identity=str(demo_user.id))
        
        return jsonify({
            'access_token': access_token,
            'message': '¡Bienvenido al modo demo! Explora la aplicación con datos de ejemplo.',
            'demo_user': {
                'name': demo_user.name,
                'email': demo_user.email
            },
            'note': 'Los datos se regeneran en cada acceso al modo demo.'
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': 'Error al crear sesión demo',
            'details': str(e)
        }), 500


@demo_bp.route('/reset', methods=['POST'])
def reset_demo():
    """
    Endpoint para resetear los datos del usuario demo.
    Útil si quieres que los usuarios puedan "reiniciar" la demo.
    """
    try:
        demo_user = create_demo_user()
        return jsonify({
            'message': 'Datos demo reseteados exitosamente',
            'demo_user': {
                'name': demo_user.name,
                'email': demo_user.email
            }
        }), 200
    except Exception as e:
        return jsonify({
            'error': 'Error al resetear datos demo',
            'details': str(e)
        }), 500
