# 🔧 Solución de Errores en Vercel

## Error: 500 INTERNAL_SERVER_ERROR - FUNCTION_INVOCATION_FAILED

### Causas Comunes:

1. ❌ Variables de entorno no configuradas
2. ❌ Base de datos PostgreSQL no accesible
3. ❌ Tablas de base de datos no creadas
4. ❌ Dependencias faltantes

---

## ✅ Solución Paso a Paso

### 1. Verificar Variables de Entorno en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

Debe tener estas 3 variables configuradas:

```
DATABASE_URL=postgresql://user:password@host/database
SECRET_KEY=tu_clave_secreta_aqui
JWT_SECRET_KEY=tu_clave_jwt_aqui
```

#### 🔑 Generar Claves Secretas

Ejecuta esto en tu terminal local:

```bash
python -c "import secrets; print('SECRET_KEY=' + secrets.token_hex(32))"
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_hex(32))"
```

Copia los resultados y agrégalos en Vercel.

---

### 2. Verificar la Base de Datos PostgreSQL

#### Opción A: Crear en Neon (Recomendado)

1. Ve a https://neon.tech
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la **Connection String**:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
5. Pégala en Vercel como `DATABASE_URL`

#### Opción B: Verificar tu Base de Datos Actual

Si ya tienes una base de datos PostgreSQL, verifica:

- ✅ La cadena de conexión es correcta
- ✅ El servidor está activo
- ✅ Permite conexiones externas
- ✅ Las credenciales son válidas

---

### 3. Crear las Tablas en la Base de Datos

Una vez que tengas PostgreSQL configurado, necesitas crear las tablas.

#### Método 1: Usando el Script (Recomendado)

1. En tu máquina local, crea un archivo `create_tables.py`:

```python
import os
from app import create_app, db

# IMPORTANTE: Usa la URL de tu base de datos de producción
os.environ['DATABASE_URL'] = 'postgresql://tu_connection_string_aqui'

app = create_app()

with app.app_context():
    print("🔧 Creando tablas en PostgreSQL...")
    try:
        db.create_all()
        print("✅ ¡Tablas creadas exitosamente!")
        
        # Verificar tablas creadas
        from sqlalchemy import inspect
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"\n📋 Tablas creadas: {', '.join(tables)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
```

2. Ejecuta:
```bash
pip install psycopg2-binary  # Solo si no lo tienes
python create_tables.py
```

#### Método 2: Usando Flask-Migrate

```bash
# Configura la URL de producción
export DATABASE_URL="tu_postgresql_url"  # Linux/Mac
set DATABASE_URL=tu_postgresql_url        # Windows

# Aplica las migraciones
flask db upgrade
```

---

### 4. Re-deploy en Vercel

Después de configurar todo:

1. **Commit y Push** los cambios:
   ```bash
   git add .
   git commit -m "fix: Configure for Vercel deployment"
   git push origin demo
   ```

2. Vercel se re-desplegará automáticamente

3. O fuerza un re-deploy:
   - Ve a tu proyecto en Vercel
   - Click en **Deployments**
   - Click en los 3 puntos (...) del último deployment
   - Click en **Redeploy**

---

### 5. Verificar los Logs

Para ver qué está causando el error exacto:

1. Ve a tu proyecto en Vercel
2. Click en **Deployments**
3. Click en el deployment actual
4. Ve a la pestaña **Functions**
5. Click en **View Logs**

Busca mensajes de error específicos como:
- `No module named 'xxx'` → Falta una dependencia
- `Connection refused` → Problema con la base de datos
- `KeyError: 'DATABASE_URL'` → Variable de entorno faltante

---

### 6. Probar Localmente Primero

Antes de deployar, asegúrate de que funciona localmente:

```bash
# Configurar para usar PostgreSQL local o remoto
export DATABASE_URL="tu_postgresql_url"

# Ejecutar la app
python run.py

# Probar el endpoint de demo
curl http://127.0.0.1:5000/demo/access
```

Si funciona localmente, debería funcionar en Vercel.

---

## 🔍 Checklist de Verificación

- [ ] ✅ Variables de entorno configuradas en Vercel
- [ ] ✅ Base de datos PostgreSQL creada y accesible
- [ ] ✅ Tablas creadas en la base de datos
- [ ] ✅ requirements.txt tiene todas las dependencias
- [ ] ✅ vercel.json está configurado correctamente
- [ ] ✅ api/index.py existe
- [ ] ✅ La app funciona localmente con PostgreSQL

---

## 🆘 Comandos Útiles para Diagnóstico

### Ver logs en tiempo real:
```bash
vercel logs --follow
```

### Probar el endpoint de demo:
```bash
curl https://tu-app.vercel.app/demo/access
```

### Verificar variables de entorno:
```bash
vercel env ls
```

---

## 💡 Soluciones Rápidas Comunes

### Error: "No module named 'flask'"
**Solución**: Verifica que `requirements.txt` esté en la raíz del proyecto.

### Error: "No such table: users"
**Solución**: Las tablas no existen. Ejecuta el script de creación de tablas.

### Error: "Connection refused"
**Solución**: La base de datos no es accesible. Verifica la URL y los permisos.

### Error: "Invalid token"
**Solución**: `JWT_SECRET_KEY` no está configurado o es diferente.

---

## 📞 ¿Todavía tienes problemas?

1. Copia el error completo de los logs de Vercel
2. Verifica cada punto del checklist
3. Asegúrate de que funciona localmente con PostgreSQL
4. Revisa la documentación de Vercel para Python: https://vercel.com/docs/frameworks/python

---

**¡Buena suerte!** 🚀
