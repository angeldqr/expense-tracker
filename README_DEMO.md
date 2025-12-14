# 🎭 Expense Tracker - Rama Demo

> **Nota**: Esta es una versión especial del proyecto con **Modo Demo** integrado para portfolios y demos públicas.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/angeldqr/expense-tracker/tree/demo)

## 🌟 Características Especiales de esta Rama

### ✨ Modo Demo Sin Registro
- **Acceso instantáneo**: Los visitantes pueden probar la app con un solo clic
- **Datos pre-cargados**: Incluye transacciones y categorías de ejemplo
- **Perfecto para portfolios**: Ideal para mostrar tu proyecto a reclutadores

### 🚀 Funcionalidades Principales
- ✅ Gestión completa de ingresos y gastos
- 📊 Dashboard con gráficos interactivos (Chart.js)
- 📱 Diseño responsive y moderno
- 🔐 Autenticación JWT
- 🎨 Interfaz dark mode elegante
- 📈 Estadísticas y reportes mensuales

## 🛠️ Stack Tecnológico

### Backend
- **Flask** - Framework web de Python
- **SQLAlchemy** - ORM para base de datos
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación segura
- **Flask-Bcrypt** - Encriptación de contraseñas

### Frontend
- **HTML5/CSS3** - Estructura y estilos modernos
- **JavaScript (Vanilla)** - Lógica del cliente
- **Chart.js** - Visualización de datos
- **Font Awesome** - Iconografía

## 📦 Instalación Local

### Prerrequisitos
- Python 3.8+
- PostgreSQL (o SQLite para desarrollo)
- pip

### Pasos

1. **Clonar el repositorio**
```bash
git clone https://github.com/angeldqr/expense-tracker.git
cd expense-tracker
git checkout demo
```

2. **Crear entorno virtual**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno**
```bash
# Copiar el archivo de ejemplo
copy .env.example .env  # Windows
cp .env.example .env    # Linux/Mac

# Editar .env con tus valores
```

5. **Inicializar base de datos**
```bash
# Crear las tablas
flask db upgrade

# O usar el script manual
python init_production_db.py
```

6. **Ejecutar la aplicación**
```bash
python run.py
```

7. **Abrir en el navegador**
```
http://127.0.0.1:5000
```

## 🚀 Deployment en Vercel

Para desplegar esta aplicación en Vercel, sigue la guía detallada: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)

### Resumen Rápido:

1. Crea una base de datos PostgreSQL (Neon, Railway, Supabase)
2. Haz push del código a GitHub (rama demo)
3. Importa el proyecto en Vercel
4. Configura variables de entorno
5. ¡Deploy!

## 📚 Documentación Adicional

- [Modo Demo - Guía Completa](DEMO_MODE.md) - Detalles sobre el modo demo
- [Deployment en Vercel](VERCEL_DEPLOYMENT.md) - Guía paso a paso para Vercel
- [PostgreSQL Setup](POSTGRESQL_SETUP.md) - Configuración de la base de datos

## 🎯 Uso del Modo Demo

### Para Visitantes
1. Abre la aplicación
2. Haz clic en **"Probar Modo Demo"**
3. ¡Explora todas las funcionalidades!

### Para Desarrolladores

El endpoint de demo está en: `GET /demo/access`

```javascript
// Ejemplo de uso
fetch('/demo/access')
  .then(res => res.json())
  .then(data => {
    localStorage.setItem('access_token', data.access_token);
    // Redirigir al dashboard
  });
```

## 🔧 Variables de Entorno

```bash
# Base de datos
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# Seguridad
SECRET_KEY=tu_clave_secreta
JWT_SECRET_KEY=tu_clave_jwt

# Configuración
FLASK_ENV=production
```

## 📂 Estructura del Proyecto

```
expense-tracker/
├── app/
│   ├── routes/
│   │   ├── auth.py          # Autenticación
│   │   ├── transactions.py  # CRUD de transacciones
│   │   ├── categories.py    # Gestión de categorías
│   │   ├── stats.py         # Estadísticas
│   │   └── demo.py          # 🆕 Modo demo
│   ├── static/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── script.js
│   ├── models.py
│   └── __init__.py
├── templates/
│   └── index.html
├── migrations/
├── run.py
├── requirements.txt
├── vercel.json              # 🆕 Configuración de Vercel
├── DEMO_MODE.md             # 🆕 Documentación del modo demo
└── VERCEL_DEPLOYMENT.md     # 🆕 Guía de deployment
```

## 🎨 Capturas de Pantalla

### Página de Login con Modo Demo
![Login Screen](docs/screenshots/login-demo.png)

### Dashboard Principal
![Dashboard](docs/screenshots/dashboard.png)

### Gestión de Transacciones
![Transactions](docs/screenshots/transactions.png)

## 🤝 Contribuir

Esta rama está optimizada para demos. Para contribuir al proyecto principal:

1. Fork el repositorio
2. Crea una rama desde `main` (no desde `demo`)
3. Haz tus cambios
4. Envía un Pull Request a `main`

## 🐛 Reportar Problemas

Si encuentras un bug en el modo demo:

1. Ve a [Issues](https://github.com/angeldqr/expense-tracker/issues)
2. Crea un nuevo issue
3. Etiquétalo con `demo` y `bug`

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 👤 Autor

**Angel D. Quintero**
- GitHub: [@angeldqr](https://github.com/angeldqr)
- LinkedIn: [tu-perfil](https://linkedin.com/in/tu-perfil)

## 🌟 Agradecimientos

- Chart.js por los gráficos interactivos
- Flask por el framework web
- Vercel por el hosting gratuito

---

## 🔗 Links Útiles

- [Demo en Vivo](https://tu-app.vercel.app) - Prueba la aplicación
- [Documentación Completa](https://github.com/angeldqr/expense-tracker/wiki)
- [Repositorio Principal](https://github.com/angeldqr/expense-tracker)

---

**⭐ Si te gustó este proyecto, no olvides darle una estrella en GitHub!**
