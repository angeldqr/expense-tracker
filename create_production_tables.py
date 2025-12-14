"""
Script simple para crear las tablas en PostgreSQL de producción.
Ejecuta esto ANTES de hacer el deploy final en Vercel.

Uso:
    1. Configura la variable DATABASE_URL con tu PostgreSQL de Neon/Railway/Supabase
    2. Ejecuta: python create_production_tables.py
"""

import os
import sys

def main():
    print("=" * 70)
    print("  CREAR TABLAS EN BASE DE DATOS DE PRODUCCIÓN")
    print("=" * 70)
    print()
    
    # Verificar que existe la variable de entorno
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("❌ ERROR: La variable DATABASE_URL no está configurada")
        print()
        print("Por favor, configura la variable de entorno primero:")
        print()
        print("Windows PowerShell:")
        print('  $env:DATABASE_URL="postgresql://user:pass@host/db"')
        print()
        print("Linux/Mac:")
        print('  export DATABASE_URL="postgresql://user:pass@host/db"')
        print()
        return False
    
    # Verificar que es PostgreSQL
    if not database_url.startswith(('postgresql://', 'postgres://')):
        print("⚠️  ADVERTENCIA: No parece ser una URL de PostgreSQL")
        print(f"   URL actual: {database_url[:30]}...")
        print()
        response = input("¿Continuar de todos modos? (s/n): ")
        if response.lower() != 's':
            print("Operación cancelada.")
            return False
    
    print(f"🔗 Conectando a: {database_url[:40]}...")
    print()
    
    try:
        # Importar después de verificar la URL
        from app import create_app, db
        
        # Crear la aplicación
        app = create_app()
        
        with app.app_context():
            print("📦 Creando tablas...")
            db.create_all()
            print("✅ ¡Tablas creadas exitosamente!")
            print()
            
            # Verificar qué tablas se crearon
            try:
                from sqlalchemy import inspect
                inspector = inspect(db.engine)
                tables = inspector.get_table_names()
                
                print(f"📋 Tablas creadas ({len(tables)}):")
                for table in tables:
                    print(f"   ✓ {table}")
                print()
            except Exception as e:
                print(f"   (No se pudo listar las tablas: {e})")
                print()
            
            return True
            
    except ImportError as e:
        print(f"❌ ERROR: Falta instalar dependencias")
        print(f"   {e}")
        print()
        print("Instala las dependencias con:")
        print("   pip install -r requirements.txt")
        return False
        
    except Exception as e:
        print(f"❌ ERROR al crear tablas: {e}")
        print()
        import traceback
        traceback.print_exc()
        print()
        print("Posibles causas:")
        print("  1. La URL de la base de datos es incorrecta")
        print("  2. La base de datos no permite conexiones externas")
        print("  3. Las credenciales son incorrectas")
        print("  4. Falta instalar psycopg2-binary")
        return False

if __name__ == '__main__':
    print()
    success = main()
    print("=" * 70)
    
    if success:
        print("✅ PROCESO COMPLETADO")
        print()
        print("Próximos pasos:")
        print("  1. Configura las mismas variables en Vercel:")
        print("     - DATABASE_URL")
        print("     - SECRET_KEY")
        print("     - JWT_SECRET_KEY")
        print("  2. Haz commit y push:")
        print("     git add .")
        print('     git commit -m "fix: Configure for Vercel"')
        print("     git push origin demo")
        print("  3. Vercel se desplegará automáticamente")
    else:
        print("❌ PROCESO FALLIDO")
        print()
        print("Revisa los errores anteriores y:")
        print("  1. Verifica la URL de la base de datos")
        print("  2. Asegúrate de tener todas las dependencias instaladas")
        print("  3. Verifica que la base de datos permita conexiones externas")
    
    print("=" * 70)
    print()
    
    sys.exit(0 if success else 1)
