# Modo Demo - Expense Tracker

## 🎯 Descripción

Esta rama `demo` incluye una funcionalidad especial para permitir que los visitantes de tu portfolio prueben la aplicación sin necesidad de registrarse o iniciar sesión.

## ✨ Características del Modo Demo

- **Acceso instantáneo**: Los usuarios pueden probar la aplicación con un solo clic
- **Datos pre-cargados**: El usuario demo viene con transacciones y categorías de ejemplo de los últimos 3 meses
- **Datos frescos**: Los datos se regeneran automáticamente cada vez que alguien accede al modo demo
- **Sin registro requerido**: Perfecto para demos públicas en tu portfolio

## 🚀 Cómo Funciona

### Para los Usuarios

1. En la página de inicio de sesión, verán un botón **"Probar Modo Demo"** 
2. Al hacer clic, obtienen acceso inmediato a la aplicación con datos de ejemplo
3. Pueden explorar todas las funcionalidades sin crear una cuenta

### Endpoints de Demo

#### `GET/POST /demo/access`
- Crea o actualiza el usuario demo con datos de ejemplo
- Retorna un token JWT válido
- No requiere autenticación

**Respuesta exitosa:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "message": "¡Bienvenido al modo demo! Explora la aplicación con datos de ejemplo.",
  "demo_user": {
    "name": "Usuario Demo",
    "email": "demo@expense-tracker.com"
  },
  "note": "Los datos se regeneran en cada acceso al modo demo."
}
```

#### `POST /demo/reset`
- Resetea los datos del usuario demo
- Útil para "reiniciar" la experiencia demo
- No requiere autenticación

## 📊 Datos de Ejemplo Incluidos

El modo demo crea automáticamente:

### Categorías
- Alimentación
- Transporte
- Vivienda
- Entretenimiento
- Salud
- Educación
- Salario
- Inversiones
- Otros

### Transacciones
- **Ingresos**: Salarios, freelance, ventas
- **Gastos**: Supermercado, alquiler, servicios, gasolina, entretenimiento, etc.
- **Rango temporal**: Últimos 3 meses con datos realistas

## 🎨 Interfaz de Usuario

Se agregó un botón estilizado con:
- Icono de matraz (flask) para representar el modo experimental/demo
- Gradiente morado distintivo
- Animaciones suaves al hacer hover
- Estado de carga mientras se genera el acceso

## 🔧 Configuración para Vercel

### Variables de Entorno Necesarias

Asegúrate de configurar estas variables en Vercel:

```bash
DATABASE_URL=tu_url_de_postgresql
SECRET_KEY=tu_clave_secreta_para_jwt
JWT_SECRET_KEY=tu_clave_jwt
```

### Archivo `vercel.json` (Recomendado)

```json
{
  "builds": [
    {
      "src": "run.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "run.py"
    }
  ]
}
```

### `requirements.txt`

Asegúrate de que incluya:
```
Flask
flask-sqlalchemy
flask-migrate
flask-jwt-extended
flask-bcrypt
flask-cors
psycopg2-binary
python-dotenv
```

## 🛡️ Consideraciones de Seguridad

1. **Usuario Demo Aislado**: El usuario demo tiene su propio espacio aislado
2. **Regeneración de Datos**: Los datos se limpian y regeneran en cada acceso
3. **Sin Información Sensible**: No se almacena información personal real
4. **Rate Limiting**: Considera agregar rate limiting en producción

## 📝 Uso en Producción

### Para Portfolio/Demo Público

Esta rama es ideal para:
- Mostrar el proyecto en tu portfolio
- Demos en vivo durante entrevistas
- Permitir que reclutadores prueben tu aplicación
- Compartir en redes sociales

### Recomendaciones

1. **Banner de Demo**: Considera agregar un banner que indique que están en modo demo
2. **Limitaciones**: Opcionalmente, puedes limitar algunas funciones en modo demo
3. **Analytics**: Agrega Google Analytics o similar para rastrear el uso
4. **Feedback**: Incluye un formulario de feedback para los usuarios

## 🔄 Mantenimiento

### Limpiar Datos Demo Antiguos

Si necesitas limpiar manualmente el usuario demo:

```python
from app import create_app, db
from app.models import User, Transaction, Category

app = create_app()
with app.app_context():
    demo_user = User.query.filter_by(email='demo@expense-tracker.com').first()
    if demo_user:
        Transaction.query.filter_by(user_id=demo_user.id).delete()
        Category.query.filter_by(user_id=demo_user.id).delete()
        db.session.delete(demo_user)
        db.session.commit()
```

## 🎭 Personalización

Puedes personalizar los datos demo editando `app/routes/demo.py`:

- Modifica las categorías en `categories_data`
- Ajusta las transacciones en `transactions_data`
- Cambia el rango de fechas para más o menos meses
- Personaliza los montos y descripciones

## 📞 Soporte

Si tienes problemas con el modo demo:

1. Verifica que la base de datos esté conectada
2. Revisa los logs de la consola del navegador
3. Asegúrate de que el endpoint `/demo/access` sea accesible
4. Verifica que JWT esté configurado correctamente

## 🌟 Mejoras Futuras

Ideas para expandir el modo demo:

- [ ] Agregar un temporizador de sesión (ej: 30 minutos)
- [ ] Mostrar un tour guiado para nuevos usuarios
- [ ] Agregar notificaciones explicativas
- [ ] Permitir exportar datos demo como ejemplo
- [ ] Agregar más variedad en los datos de ejemplo
- [ ] Implementar un "modo sandbox" persistente

---

**Nota**: Esta es una rama especial para demos. Para desarrollo continuo, usa la rama `main`.
