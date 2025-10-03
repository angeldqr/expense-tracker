# 🗄️ Guía de Configuración de PostgreSQL para Expense Tracker

Esta guía te ayudará a configurar PostgreSQL paso a paso.

---

## 📋 Contenido

1. [¿Por qué PostgreSQL?](#por-qué-postgresql)
2. [Instalación](#instalación)
3. [Configuración Rápida](#configuración-rápida)
4. [Configuración Manual](#configuración-manual)
5. [Verificar la Conexión](#verificar-la-conexión)
6. [Solución de Problemas](#solución-de-problemas)

---

## ❓ ¿Por qué PostgreSQL?

**SQLite (Por defecto):**
- ✅ Perfecto para desarrollo
- ✅ No requiere instalación
- ✅ Fácil de usar
- ❌ No apto para producción con múltiples usuarios

**PostgreSQL (Recomendado para producción):**
- ✅ Base de datos profesional
- ✅ Soporta múltiples usuarios simultáneos
- ✅ Mejor rendimiento
- ✅ Más seguro y escalable

---

## 📥 Instalación

### Windows

1. **Descargar PostgreSQL:**
   - Ir a: https://www.postgresql.org/download/windows/
   - Descargar el instalador (versión 15 o superior)

2. **Ejecutar el instalador:**
   - Aceptar la ubicación por defecto
   - Elegir componentes: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Configurar puerto: `5432` (por defecto)
   - Configurar contraseña del superusuario `postgres` (¡Recuérdala!)

3. **Verificar instalación:**
```cmd
psql --version
```

### macOS

```bash
# Instalar con Homebrew
brew install postgresql@15

# Iniciar el servicio
brew services start postgresql@15

# Verificar instalación
psql --version
```

### Linux (Ubuntu/Debian)

```bash
# Actualizar repositorios
sudo apt update

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Iniciar el servicio
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar instalación
psql --version
```

---

## ⚡ Configuración Rápida (Script Automático)

### Opción 1: Usando el script SQL incluido

```bash
# 1. Ejecutar el script de configuración
psql -U postgres -f setup_database.sql

# 2. Actualizar el archivo .env
DATABASE_URL=postgresql://expense_user:expense_password_123@localhost:5432/expense_tracker

# 3. Reiniciar la aplicación
python run.py
```

**¡Listo!** La base de datos está configurada.

---

## 🛠️ Configuración Manual

### Paso 1: Acceder a PostgreSQL

**Windows:**
```cmd
psql -U postgres
```

**macOS/Linux:**
```bash
sudo -u postgres psql
```

Te pedirá la contraseña que configuraste durante la instalación.

### Paso 2: Crear la base de datos

```sql
CREATE DATABASE expense_tracker;
```

### Paso 3: Crear un usuario

```sql
CREATE USER expense_user WITH PASSWORD 'tu_password_segura';
```

⚠️ **Importante:** Cambia `tu_password_segura` por una contraseña fuerte.

### Paso 4: Dar permisos

```sql
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;
```

### Paso 5: Conectarse a la base de datos

```sql
\c expense_tracker
```

### Paso 6: Dar permisos al esquema

```sql
GRANT ALL ON SCHEMA public TO expense_user;
```

### Paso 7: Salir

```sql
\q
```

---

## ✅ Verificar la Conexión

### Opción 1: Desde la terminal

```bash
psql -U expense_user -d expense_tracker -h localhost
```

Si te pide contraseña y puedes conectarte, ¡está funcionando!

### Opción 2: Usando pgAdmin 4

1. Abrir pgAdmin 4
2. Click derecho en "Servers" → "Register" → "Server..."
3. Configurar:
   - Name: `Expense Tracker`
   - Host: `localhost`
   - Port: `5432`
   - Database: `expense_tracker`
   - Username: `expense_user`
   - Password: (la que configuraste)
4. Guardar

---

## 🔧 Actualizar el proyecto

### 1. Instalar el driver de PostgreSQL

```bash
pip install psycopg2-binary
```

### 2. Actualizar el archivo `.env`

```env
DATABASE_URL=postgresql://expense_user:tu_password@localhost:5432/expense_tracker
```

**Formato completo:**
```
postgresql://[usuario]:[contraseña]@[host]:[puerto]/[nombre_base_datos]
```

**Ejemplo:**
```
postgresql://expense_user:miPassword123@localhost:5432/expense_tracker
```

### 3. Reiniciar la aplicación

```bash
python run.py
```

Flask creará automáticamente las tablas en PostgreSQL.

---

## 🐛 Solución de Problemas

### Error: "psql: command not found"

**Solución:** Agregar PostgreSQL al PATH

**Windows:**
1. Buscar "Variables de entorno" en el menú inicio
2. Editar "Path" en Variables del sistema
3. Agregar: `C:\Program Files\PostgreSQL\15\bin`
4. Reiniciar la terminal

**macOS/Linux:**
```bash
export PATH="/usr/local/opt/postgresql@15/bin:$PATH"
```

### Error: "password authentication failed"

**Solución:** Verificar usuario y contraseña en `.env`

### Error: "connection refused"

**Solución:** Verificar que PostgreSQL esté ejecutándose

**Windows:**
```cmd
# Ver servicios
services.msc
# Buscar "postgresql-x64-15" y asegurarse que esté "Iniciado"
```

**macOS:**
```bash
brew services list
brew services restart postgresql@15
```

**Linux:**
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Error: "database does not exist"

**Solución:** Crear la base de datos manualmente (ver Configuración Manual)

---

## 📚 Comandos Útiles de PostgreSQL

```sql
-- Listar bases de datos
\l

-- Conectarse a una base de datos
\c nombre_base_datos

-- Listar tablas
\dt

-- Ver descripción de una tabla
\d nombre_tabla

-- Listar usuarios
\du

-- Salir
\q
```

---

## 🔒 Mejores Prácticas de Seguridad

1. ✅ **Nunca uses contraseñas simples**
   - ❌ Mal: `123456`, `password`
   - ✅ Bien: `Xk9$mP2@nQ7&`

2. ✅ **Cambia el password por defecto del script**
   ```sql
   ALTER USER expense_user WITH PASSWORD 'nueva_password_segura';
   ```

3. ✅ **No subas el archivo `.env` a Git**
   - Ya está incluido en `.gitignore`

4. ✅ **Usa usuarios diferentes para desarrollo y producción**

---

## 🚀 Migración de SQLite a PostgreSQL

Si ya tienes datos en SQLite y quieres migrarlos:

### Opción 1: Exportar e importar manualmente

1. **Exportar datos de SQLite:**
```bash
sqlite3 app/expenses.db .dump > backup.sql
```

2. **Adaptar el SQL para PostgreSQL** (cambiar sintaxis si es necesario)

3. **Importar a PostgreSQL:**
```bash
psql -U expense_user -d expense_tracker -f backup.sql
```

### Opción 2: Usar herramientas de migración

```bash
pip install pgloader
pgloader app/expenses.db postgresql://expense_user:password@localhost/expense_tracker
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs de PostgreSQL:
   - Windows: `C:\Program Files\PostgreSQL\15\data\log\`
   - Linux: `/var/log/postgresql/`

2. Verifica la conexión con:
```bash
psql -U expense_user -d expense_tracker -h localhost
```

3. Consulta la documentación oficial: https://www.postgresql.org/docs/

---

**¡Disfruta de tu base de datos PostgreSQL!** 🐘✨