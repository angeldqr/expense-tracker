"""
Script para inicializar la base de datos en producción.
Ejecutar después del primer deployment en Vercel.

Uso:
    python init_production_db.py
"""

from app import create_app, db
import os

def init_database():
    """Inicializa las tablas de la base de datos en producción"""
    
    # Verificar que exista la variable de entorno
    if not os.getenv('DATABASE_URL'):
        print("❌ ERROR: DATABASE_URL no está configurado")
        print("   Configura la variable de entorno antes de ejecutar este script")
        return False
    
    print("🔧 Inicializando base de datos...")
    print(f"📍 URL: {os.getenv('DATABASE_URL')[:30]}...")
    
    try:
        app = create_app()
        
        with app.app_context():
            print("📦 Creando tablas...")
            db.create_all()
            print("✅ ¡Tablas creadas exitosamente!")
            
            # Verificar que las tablas se crearon
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            
            print(f"\n📋 Tablas creadas ({len(tables)}):")
            for table in tables:
                print(f"   ✓ {table}")
            
            return True
            
    except Exception as e:
        print(f"❌ ERROR al crear tablas: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    print("=" * 60)
    print("  INICIALIZACIÓN DE BASE DE DATOS PARA PRODUCCIÓN")
    print("=" * 60)
    print()
    
    success = init_database()
    
    print()
    print("=" * 60)
    if success:
        print("✅ Proceso completado exitosamente")
        print("🚀 Tu aplicación está lista para usar!")
        print()
        print("💡 Próximos pasos:")
        print("   1. Prueba el modo demo en tu URL de Vercel")
        print("   2. Verifica que las transacciones se carguen correctamente")
    else:
        print("❌ Proceso falló")
        print("🔍 Revisa los errores arriba y:")
        print("   1. Verifica la configuración de DATABASE_URL")
        print("   2. Asegúrate de que la base de datos sea accesible")
        print("   3. Verifica que psycopg2-binary esté instalado")
    print("=" * 60)
