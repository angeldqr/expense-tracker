from . import db, bcrypt
from datetime import datetime

# ==============================================================================
# MODELO DE USUARIO (USERS)
# ==============================================================================
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # --- Relaciones ---
    # Un usuario tiene muchas transacciones y muchas categorías
    # cascade="all, delete-orphan" significa que si borras un usuario,
    # se borran en cascada todas sus transacciones y categorías. Limpieza automática.
    transactions = db.relationship('Transaction', backref='owner', lazy=True, cascade="all, delete-orphan")
    categories = db.relationship('Category', backref='owner', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        """Genera un hash seguro para la contraseña y lo almacena."""
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf8')

    def check_password(self, password):
        """Verifica la contraseña proporcionada contra el hash almacenado."""
        return bcrypt.check_password_hash(self.password_hash, password)

    def __repr__(self):
        return f'<User {self.email}>'

# ==============================================================================
# MODELO DE CATEGORÍAS (CATEGORIES)
# ==============================================================================
class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    def __repr__(self):
        return f'<Category {self.name}>'

# ==============================================================================
# MODELO DE TRANSACCIONES (TRANSACTIONS)
# ==============================================================================
class Transaction(db.Model):
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False) # Usamos Numeric para precisión monetaria
    type = db.Column(db.String(7), nullable=False) # 'income' o 'expense'
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    
    # --- Claves Foráneas ---
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)

    # --- Relaciones ---
    # Una transacción pertenece a una categoría
    category = db.relationship('Category', backref='transactions', lazy=True)

    def __repr__(self):
        return f'<Transaction {self.description} - {self.amount}>'