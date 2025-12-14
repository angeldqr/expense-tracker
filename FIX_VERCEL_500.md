# 🚨 SOLUCIÓN RÁPIDA - Error 500 en Vercel

## El problema actual:
Tu aplicación se desplegó pero está crasheando con error 500.

## Causa más probable:
❌ **Las tablas de la base de datos NO existen**

---

## ✅ SOLUCIÓN EN 5 PASOS:

### 1️⃣ Crea una Base de Datos PostgreSQL

#### Opción A: Neon (Recomendado - Más fácil)

1. Ve a: https://neon.tech
2. Crea cuenta gratuita
3. Click en **"Create Project"**
4. Copia la **Connection String** que se ve así:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

#### Opción B: Supabase

1. Ve a: https://supabase.com
2. Crea cuenta gratuita
3. Nuevo proyecto
4. Ve a **Settings** → **Database** → **Connection String**
5. Copia la URI en modo **"Connection Pooling"**

---

### 2️⃣ Configura las Variables en Vercel

Ve a tu proyecto en Vercel → **Settings** → **Environment Variables**

Agrega estas 3 variables:

```
DATABASE_URL = [pega tu connection string de PostgreSQL]
SECRET_KEY = [genera con el comando de abajo]
JWT_SECRET_KEY = [genera con el comando de abajo]
```

**Para generar las claves secretas**, ejecuta en tu terminal local:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Ejecuta 2 veces para tener 2 claves diferentes.

---

### 3️⃣ Crea las Tablas en PostgreSQL

En tu computadora local:

```bash
# 1. Configura la variable de entorno (usa la misma URL que pusiste en Vercel)
$env:DATABASE_URL="postgresql://tu_url_aqui"

# 2. Instala psycopg2 (si no lo tienes)
pip install psycopg2-binary

# 3. Ejecuta el script para crear las tablas
python create_production_tables.py
```

Deberías ver:
```
✅ ¡Tablas creadas exitosamente!
📋 Tablas creadas (4):
   ✓ users
   ✓ categories
   ✓ transactions
   ✓ alembic_version
```

---

### 4️⃣ Re-deploy en Vercel

```bash
# Haz commit de los cambios nuevos
git add .
git commit -m "fix: Configure for Vercel deployment"
git push origin demo
```

Vercel se re-desplegará automáticamente.

**O** fuerza un redeploy desde el dashboard de Vercel:
- Deployments → ... (3 puntos) → Redeploy

---

### 5️⃣ Prueba tu Aplicación

1. Ve a tu URL de Vercel: `https://tu-app.vercel.app`
2. Haz click en **"Probar Modo Demo"**
3. ¡Debería funcionar! 🎉

---

## 🔍 Si sigue sin funcionar:

### Ver los logs exactos del error:

1. Ve a Vercel → Tu proyecto
2. Click en **Deployments**
3. Click en el deployment actual
4. Click en **View Function Logs**
5. Busca el mensaje de error exacto

### Errores comunes:

| Error | Solución |
|-------|----------|
| `no such table: users` | Ejecuta `create_production_tables.py` |
| `Connection refused` | Verifica la URL de PostgreSQL |
| `Invalid token` | Configura `JWT_SECRET_KEY` en Vercel |
| `Module not found` | Verifica `requirements.txt` |

---

## 📞 ¿Necesitas ayuda?

Comparte:
1. El error exacto de los logs de Vercel
2. Confirmación de que las 3 variables están en Vercel
3. Confirmación de que las tablas se crearon exitosamente

---

## 📚 Documentación Completa

- `TROUBLESHOOTING.md` - Guía detallada de solución de problemas
- `VERCEL_DEPLOYMENT.md` - Guía completa de deployment
- `DEMO_MODE.md` - Documentación del modo demo

---

**¡Éxito!** 🚀
