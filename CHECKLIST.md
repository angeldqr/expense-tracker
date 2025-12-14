# ✅ CHECKLIST - Deployment Vercel

## Antes del Deployment

- [ ] ✅ Código del modo demo implementado
- [ ] ✅ Frontend actualizado con botón de demo
- [ ] ✅ JavaScript configurado para URLs dinámicas
- [ ] ✅ CORS configurado
- [ ] ✅ requirements.txt actualizado
- [ ] ✅ vercel.json creado

## Base de Datos

- [ ] Crear cuenta en Neon/Railway/Supabase
- [ ] Crear nueva base de datos PostgreSQL
- [ ] Copiar connection string

## Vercel Setup

- [ ] Crear cuenta en Vercel
- [ ] Conectar repositorio GitHub
- [ ] Seleccionar rama `demo`
- [ ] Configurar variables de entorno:
  - [ ] DATABASE_URL
  - [ ] SECRET_KEY
  - [ ] JWT_SECRET_KEY
  - [ ] FLASK_ENV=production

## Después del Deployment

- [ ] Ejecutar `init_production_db.py` para crear tablas
- [ ] Probar el modo demo
- [ ] Verificar que las transacciones se carguen
- [ ] Probar registro/login normales

## Testing

- [ ] Hacer clic en "Probar Modo Demo"
- [ ] Verificar que se carguen transacciones de ejemplo
- [ ] Navegar por el dashboard
- [ ] Crear una transacción de prueba
- [ ] Verificar gráficos
- [ ] Probar en móvil

## Promoción

- [ ] Agregar link a portfolio
- [ ] Compartir en LinkedIn
- [ ] Agregar a README principal
- [ ] Actualizar CV con el proyecto

---

## Comandos Útiles

### Generar claves secretas:
```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Verificar variables de entorno:
```bash
vercel env ls
```

### Ver logs en tiempo real:
```bash
vercel logs
```

### Redeploy:
```bash
git push origin demo
```

---

¡Buena suerte! 🚀
