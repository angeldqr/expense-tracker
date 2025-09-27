from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Transaction, Category
from app import db
from sqlalchemy import func
from datetime import datetime

stats_bp = Blueprint('stats', __name__, url_prefix='/stats')

@stats_bp.route('/', methods=['GET'])
@jwt_required()
def get_stats():
    """Calcula y devuelve las estadísticas financieras del mes actual."""
    current_user_id = int(get_jwt_identity())
    
    # Obtener el primer y último día del mes actual
    today = datetime.utcnow()
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # --- 1. Calcular KPIs (Ingresos, Gastos, Balance) ---
    total_income = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user_id,
        Transaction.type == 'income',
        Transaction.date >= start_of_month
    ).scalar() or 0.0

    total_expense = db.session.query(func.sum(Transaction.amount)).filter(
        Transaction.user_id == current_user_id,
        Transaction.type == 'expense',
        Transaction.date >= start_of_month
    ).scalar() or 0.0

    balance = total_income - total_expense

    # --- 2. Calcular distribución de gastos por categoría ---
    expense_by_category = db.session.query(
        Category.name,
        func.sum(Transaction.amount)
    ).join(Transaction).filter(
        Transaction.user_id == current_user_id,
        Transaction.type == 'expense',
        Transaction.date >= start_of_month
    ).group_by(Category.name).all()

    # Formatear los datos para el gráfico
    chart_labels = [item[0] for item in expense_by_category]
    chart_data = [float(item[1]) for item in expense_by_category]

    return jsonify({
        "kpis": {
            "total_income": float(total_income),
            "total_expense": float(total_expense),
            "balance": float(balance)
        },
        "expense_chart": {
            "labels": chart_labels,
            "data": chart_data
        }
    })
