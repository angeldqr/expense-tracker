# 💰 Expense Tracker

**Aplicación web profesional para gestión de gastos e ingresos personales**

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Flask](https://img.shields.io/badge/flask-3.0.0-red)
![License](https://img.shields.io/badge/license-MIT-yellow)

---

## 📋 Descripción

**Expense Tracker** es una aplicación web moderna y profesional para gestionar tus finanzas personales de forma eficiente. Permite registrar, categorizar y visualizar tus ingresos y gastos con gráficos interactivos y un dashboard completo.

### ✨ Características Principales

- 🔐 **Autenticación segura** con JWT
- 📊 **Dashboard interactivo** con gráficos en tiempo real
- 💳 **Gestión de transacciones** (ingresos y gastos)
- 🏷️ **Categorías personalizables**
- 🔍 **Filtros avanzados** (por fecha, categoría, tipo, mes)
- 📄 **Paginación** de datos
- 📱 **Diseño responsive** (móvil, tablet, desktop)
- 🎨 **Interfaz moderna** con animaciones fluidas
- ⚡ **Validación en tiempo real**
- 📈 **Gráficos interactivos** (líneas y donas)
- ⚠️ **Alertas inteligentes** de gastos elevados

---

## 🚀 Tecnologías Utilizadas

### Backend
- **Flask** 3.0.0 - Framework web
- **SQLAlchemy** - ORM para base de datos
- **Flask-JWT-Extended** - Autenticación JWT
- **Flask-CORS** - Manejo de CORS
- **SQLite** - Base de datos

### Frontend
- **JavaScript** (ES6+) - Vanilla JS moderno
- **Chart.js** - Gráficos interactivos
- **CSS3** - Diseño responsive
- **Font Awesome** - Iconos

---

## 📁 Estructura del Proyecto

```
expense-tracker/
│
├── app/
│   ├── __init__.py          # Inicialización de la app
│   ├── config.py            # Configuración
│   ├── errors.py            # Manejadores de errores
│   ├── models/
│   │   ├── user.py          # Modelo de Usuario
│   │   ├── category.py      # Modelo de Categoría
│   │   └── transaction.py   # Modelo de Transacción
│   ├── routes/
│   │   ├── auth.py          # Rutas de autenticación
│   │   ├── categories.py    # Rutas de categorías
│   │   └── transactions.py  # Rutas de transacciones
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css    # Estilos personalizados
│   │   └── js/
│   │       └── script.js    # Lógica del frontend
│   └── templates/
│       └── index.html       # SPA principal
│
├── .env.example             # Plantilla de variables de entorno
├── .gitignore              # Archivos ignorados por Git
├── requirements.txt        # Dependencias Python
├── run.py                  # Punto de entrada
└── README.md              # Este archivo

```

---

## ⚙️ Instalación y Configuración

### Prerrequisitos

- Python 3.8 o superior
- pip (gestor de paquetes de Python)
- Git (opcional)
- **PostgreSQL** (opcional, para producción)

### Pasos de Instalación

1. **Clonar el repositorio** (o descargar el ZIP)

```bash
git clone https://github.com/angeldqr/expense-tracker.git
cd expense-tracker
```

2. **Crear entorno virtual**

```bash
python -m venv venv
```

3. **Activar entorno virtual**

- Windows:
```bash
venv\Scripts\activate
```

- macOS/Linux:
```bash
source venv/bin/activate
```

4. **Instalar dependencias**

```bash
pip install -r requirements.txt
```

5. **Configurar variables de entorno**

Copiar el archivo `.env.example` a `.env` y modificar las claves secretas:

```bash
cp .env.example .env
```

Editar el archivo `.env`:

### **Opción A: Usar SQLite (Desarrollo - Por Defecto)**

```env
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
JWT_SECRET_KEY=otra_clave_secreta_jwt_diferente_aqui
FLASK_DEBUG=False
DATABASE_URL=sqlite:///expenses.db
```

### **Opción B: Usar PostgreSQL (Producción - Recomendado)**

```env
SECRET_KEY=tu_clave_secreta_muy_segura_aqui
JWT_SECRET_KEY=otra_clave_secreta_jwt_diferente_aqui
FLASK_DEBUG=False
DATABASE_URL=postgresql://expense_user:tu_password@localhost:5432/expense_tracker
```

6. **Configurar PostgreSQL** (Solo si elegiste la Opción B)

Ver guía completa en: **[POSTGRESQL_SETUP.md](POSTGRESQL_SETUP.md)**

**Resumen rápido:**

```bash
# Ejecutar el script de configuración automática
psql -U postgres -f setup_database.sql

# O crear manualmente:
psql -U postgres
CREATE DATABASE expense_tracker;
CREATE USER expense_user WITH PASSWORD 'tu_password';
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;
\q
```

Actualizar `.env`:
```env
DATABASE_URL=postgresql://expense_user:tu_password@localhost:5432/expense_tracker
```

7. **Ejecutar la aplicación**

```bash
python run.py
```

8. **Abrir en el navegador**

```
http://127.0.0.1:5000
```

---

## 🎯 Uso de la Aplicación

### 1. Registro e Inicio de Sesión

1. Al abrir la aplicación, verás el formulario de inicio de sesión
2. Haz clic en "Regístrate" para crear una nueva cuenta
3. Completa el formulario con tu nombre, email y contraseña (mínimo 8 caracteres)
4. Inicia sesión con tus credenciales

### 2. Dashboard

El dashboard muestra:
- **Balance total** (ingresos - gastos)
- **Total de ingresos** y número de transacciones
- **Total de gastos** y número de transacciones
- **Total de transacciones registradas**
- **Gráfico de líneas** con evolución de ingresos vs gastos
- **Gráfico de dona** con distribución de gastos por categoría
- **Alerta automática** si gastas más del 80% de tus ingresos

### 3. Gestión de Transacciones

**Añadir transacción:**
1. Ir a la sección "Añadir"
2. Completar el formulario:
   - Descripción
   - Monto
   - Fecha de la transacción
   - Tipo (Ingreso o Gasto)
   - Categoría
3. Clic en "Añadir Transacción"

**Filtrar transacciones:**
1. Ir a la sección "Transacciones"
2. Usar los filtros disponibles:
   - Búsqueda por descripción
   - Por categoría
   - Por tipo (ingreso/gasto)
   - Por mes
   - Por fecha específica
3. Limpiar filtros con el botón "Limpiar filtros"

**Editar/Eliminar:**
- Clic en "Editar" para modificar una transacción
- Clic en "Borrar" para eliminar (se pedirá confirmación)

### 4. Gestión de Categorías

**Crear categoría:**
1. Ir a "Añadir"
2. Clic en el botón "+" junto al selector de categorías
3. Ingresar el nombre de la nueva categoría

**Editar categoría:**
1. Buscar la categoría en la lista
2. Clic en "Editar"
3. Modificar el nombre

**Eliminar categoría:**
- Clic en "Borrar" (solo si no tiene transacciones asociadas)

---

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con Werkzeug
- ✅ Autenticación JWT con tokens seguros
- ✅ Validación de inputs en frontend y backend
- ✅ Protección contra CSRF
- ✅ CORS configurado
- ✅ Variables de entorno para claves secretas

---

## 📊 API Endpoints

### Autenticación

- `POST /auth/register` - Registrar nuevo usuario
- `POST /auth/login` - Iniciar sesión

### Categorías

- `GET /categories/` - Obtener todas las categorías
- `POST /categories/` - Crear nueva categoría
- `PUT /categories/<id>` - Actualizar categoría
- `DELETE /categories/<id>` - Eliminar categoría

### Transacciones

- `GET /transactions/` - Obtener todas las transacciones
- `GET /transactions/<id>` - Obtener transacción por ID
- `POST /transactions/` - Crear nueva transacción
- `PUT /transactions/<id>` - Actualizar transacción
- `DELETE /transactions/<id>` - Eliminar transacción

---

## 🐛 Solución de Problemas

### Error: "Module not found"

```bash
pip install -r requirements.txt
```

### Error: "Database locked"

Cerrar todas las conexiones a la base de datos y reiniciar la aplicación.

### Error: "Token has expired"

Cerrar sesión y volver a iniciar sesión.

### La aplicación no carga

1. Verificar que el puerto 5000 no esté en uso
2. Verificar que el entorno virtual esté activado
3. Revisar los logs en la consola

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Para cambios importantes:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 👤 Autor

**Ángel Quintero**

- GitHub: [@angeldqr](https://github.com/angeldqr)
- Email: angelquinteror102@gmail.com

---

## 🙏 Agradecimientos

- [Flask](https://flask.palletsprojects.com/)
- [Chart.js](https://www.chartjs.org/)
- [Font Awesome](https://fontawesome.com/)
- [Google Fonts](https://fonts.google.com/)

---

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/Dashboard.png)

### Transacciones
![Transacciones](docs/screenshots/Transacciones.png)

### Formulario para añadir transacciones
![AddTransactions](docs/screenshots/AddTransactions.png)

---

## 🔄 Changelog

### Version 1.0.0 (02/10/2025)
- ✨ Lanzamiento inicial
- ✅ Sistema de autenticación completo
- ✅ CRUD de transacciones y categorías
- ✅ Dashboard con gráficos interactivos
- ✅ Filtros avanzados y paginación
- ✅ Diseño responsive completo

---

**¡Disfruta gestionando tus finanzas personales!** 💰✨