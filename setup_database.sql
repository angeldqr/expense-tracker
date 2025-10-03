-- Script para crear la base de datos PostgreSQL de Expense Tracker
-- Ejecutar con: psql -U postgres -f setup_database.sql

-- Crear la base de datos
CREATE DATABASE expense_tracker;

-- Crear el usuario
CREATE USER expense_user WITH PASSWORD 'expense_password_123';

-- Dar permisos completos al usuario
GRANT ALL PRIVILEGES ON DATABASE expense_tracker TO expense_user;

-- Conectar a la base de datos
\c expense_tracker

-- Dar permisos al esquema public
GRANT ALL ON SCHEMA public TO expense_user;

-- Mensaje de confirmación
\echo 'Base de datos expense_tracker creada exitosamente!'
\echo 'Usuario: expense_user'
\echo 'Password: expense_password_123'
\echo ''
\echo 'IMPORTANTE: Cambia el password en produccion!'
\echo ''
\echo 'URL de conexion:'
\echo 'postgresql://expense_user:expense_password_123@localhost:5432/expense_tracker'