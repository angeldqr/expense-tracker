from flask import Blueprint, jsonify, render_template

errors_bp = Blueprint('errors', __name__)

@errors_bp.app_errorhandler(404)
def not_found_error(error):
    """Manejo de error 404 - Página no encontrada"""
    if '/api/' in str(error):
        return jsonify({'error': 'Recurso no encontrado'}), 404
    return render_template('index.html'), 200  # SPA - redirigir al index

@errors_bp.app_errorhandler(500)
def internal_error(error):
    """Manejo de error 500 - Error interno del servidor"""
    return jsonify({'error': 'Error interno del servidor'}), 500

@errors_bp.app_errorhandler(403)
def forbidden_error(error):
    """Manejo de error 403 - Prohibido"""
    return jsonify({'error': 'Acceso prohibido'}), 403

@errors_bp.app_errorhandler(400)
def bad_request_error(error):
    """Manejo de error 400 - Solicitud incorrecta"""
    return jsonify({'error': 'Solicitud incorrecta'}), 400