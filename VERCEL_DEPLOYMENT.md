# 🚀 Guía de Deployment en Vercel - Rama Demo

## Pasos para Desplegar en Vercel

### 1. Preparar la Base de Datos PostgreSQL

Necesitas una base de datos PostgreSQL en la nube. Opciones recomendadas:

#### **Opción A: Neon (Recomendado - Gratis)**
1. Ve a [neon.tech](https://neon.tech)
2. Crea una cuenta gratuita
3. Crea un nuevo proyecto
4. Copia la cadena de conexión (Connection String)

#### **Opción B: Railway**
1. Ve a [railway.app](https://railway.app)
2. Crea un nuevo proyecto
3. Agrega PostgreSQL
4. Copia la cadena de conexión

#### **Opción C: Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a Database > Connection Pooling
4. Copia la cadena de conexión en modo "Session"

### 2. Configurar el Repositorio en GitHub

```bash
# Asegúrate de estar en la rama demo
git branch

# Si no estás en demo, cámbiate
git checkout demo

# Haz commit de todos los cambios
git add .
git commit -m "feat: Add demo mode for portfolio"

# Push a GitHub
git push origin demo
```

### 3. Importar en Vercel

1. Ve a [vercel.com](https://vercel.com)
2. Inicia sesión con tu cuenta de GitHub
3. Click en **"Add New Project"**
4. Importa tu repositorio `expense-tracker`
5. **IMPORTANTE**: Selecciona la rama **`demo`** en vez de `main`

### 4. Configurar Variables de Entorno en Vercel

En la configuración del proyecto, ve a **Settings > Environment Variables** y agrega:

```bash
# Base de datos (copia de tu proveedor)
DATABASE_URL=postgresql://user:password@host:5432/database

# Claves secretas (genera nuevas para producción)
SECRET_KEY=tu_clave_secreta_super_segura_aqui
JWT_SECRET_KEY=tu_clave_jwt_super_segura_aqui

# Configuración de Flask
FLASK_ENV=production
```

**⚠️ IMPORTANTE**: Genera claves seguras con este comando:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### 5. Configurar Build Settings

Vercel debería detectar automáticamente que es un proyecto Python. Verifica:

- **Framework Preset**: Other
- **Build Command**: (dejar vacío)
- **Output Directory**: (dejar vacío)
- **Install Command**: `pip install -r requirements.txt`

### 6. Inicializar la Base de Datos

Después del primer deployment, necesitas crear las tablas:

#### Opción A: Usando Python (Recomendado)

1. Clona el repo en tu máquina local
2. Crea un archivo `init_db.py`:

```python
from app import create_app, db
import os

# Usar la URL de producción
os.environ['DATABASE_URL'] = 'tu_connection_string_de_produccion'

app = create_app()

with app.app_context():
    print("Creando tablas...")
    db.create_all()
    print("✅ Tablas creadas exitosamente!")
```

3. Ejecuta:
```bash
pip install -r requirements.txt
python init_db.py
```

#### Opción B: Usando Flask-Migrate

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar la URL de producción
export DATABASE_URL="tu_connection_string"

# Inicializar migraciones (si no existen)
flask db init

# Crear migración
flask db migrate -m "Initial migration"

# Aplicar migración
flask db upgrade
```

### 7. Probar el Deployment

1. Vercel te dará una URL tipo: `https://expense-tracker-xxx.vercel.app`
2. Abre la URL en tu navegador
3. Haz click en **"Probar Modo Demo"**
4. ¡Deberías poder acceder a la aplicación!

## 🔧 Solución de Problemas Comunes

### Error: "Module not found"

**Solución**: Asegúrate de que `requirements.txt` esté completo:

```txt
Flask==3.0.0
flask-sqlalchemy==3.1.1
flask-migrate==4.0.5
flask-jwt-extended==4.6.0
flask-bcrypt==1.0.1
flask-cors==4.0.0
psycopg2-binary==2.9.9
python-dotenv==1.0.0
```

### Error: "Database connection failed"

**Soluciones**:
1. Verifica que `DATABASE_URL` esté correctamente configurado en Vercel
2. Asegúrate de usar `psycopg2-binary` en lugar de `psycopg2`
3. Verifica que tu base de datos permita conexiones externas
4. Para Neon, usa la connection string con `?sslmode=require`

### Error: "JWT token invalid"

**Solución**: Asegúrate de que `JWT_SECRET_KEY` y `SECRET_KEY` estén configurados en Vercel.

### Error 500 en el modo demo

**Soluciones**:
1. Revisa los logs en Vercel Dashboard
2. Asegúrate de que las tablas existan en la base de datos
3. Verifica que el endpoint `/demo/access` esté registrado correctamente

### La aplicación carga pero el modo demo no funciona

**Soluciones**:
1. Abre la consola del navegador (F12)
2. Busca errores de CORS o network
3. Verifica que la URL del API en `script.js` apunte a tu dominio de Vercel
4. Considera usar URLs relativas en lugar de `http://127.0.0.1:5000`

## 🔄 Actualizaciones Futuras

Para actualizar el sitio:

```bash
# En tu rama demo
git add .
git commit -m "Update demo features"
git push origin demo

# Vercel desplegará automáticamente
```

## 📊 Monitoreo

Vercel proporciona:
- **Analytics**: Tráfico y performance
- **Logs**: Errores y warnings en tiempo real
- **Insights**: Métricas de velocidad

## 🎯 Optimizaciones Recomendadas

1. **URL Base Dinámica**: Modifica `script.js` para usar URLs relativas:

```javascript
// En lugar de:
const BASE_URL = 'http://127.0.0.1:5000';

// Usa:
const BASE_URL = window.location.origin;
```

2. **Caching**: Agrega headers de cache en Flask
3. **CDN**: Vercel automáticamente usa CDN para assets estáticos
4. **Compress**: Vercel comprime automáticamente las respuestas

## 🌟 Próximos Pasos

1. ✅ Desplegar en Vercel
2. 🔗 Agregar el link a tu portfolio
3. 📱 Compartir en LinkedIn/Twitter
4. 📈 Monitorear el uso
5. 🎨 Personalizar el banner de demo
6. 📝 Agregar Google Analytics (opcional)

## 🆘 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Flask en Vercel](https://vercel.com/docs/frameworks/python)
- [Neon Database Docs](https://neon.tech/docs)
- [Flask-JWT-Extended](https://flask-jwt-extended.readthedocs.io/)

---

¡Buena suerte con tu deployment! 🚀
