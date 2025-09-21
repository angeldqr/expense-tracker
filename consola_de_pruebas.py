import requests
import json

BASE_URL = "http://127.0.0.1:5000"
ACCESS_TOKEN = None

def print_response(response):
    """Función para imprimir la respuesta de forma legible."""
    print(f"\n--- Status Code: {response.status_code} ---")
    try:
        print("--- Response JSON ---")
        print(json.dumps(response.json(), indent=4))
    except json.JSONDecodeError:
        print("--- Response Text ---")
        print(response.text)
    print("-----------------------\n")

# --- Funciones de Autenticación ---
def register_user():
    url = f"{BASE_URL}/auth/register"
    payload = {"name": input("Introduce el nombre: "), "email": input("Introduce el email: "), "password": input("Introduce la contraseña: ")}
    response = requests.post(url, json=payload)
    print_response(response)

def login_user():
    global ACCESS_TOKEN
    url = f"{BASE_URL}/auth/login"
    payload = {"email": input("Introduce tu email: "), "password": input("Introduce tu contraseña: ")}
    response = requests.post(url, json=payload)
    if response.status_code == 200:
        ACCESS_TOKEN = response.json().get('access_token')
        print("✅ ¡Token de acceso guardado!")
    print_response(response)

# --- Funciones de Transacciones ---
def get_transactions():
    if not ACCESS_TOKEN: return print("\n❌ Error: Debes iniciar sesión primero.")
    url = f"{BASE_URL}/transactions/"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    print_response(response)

def create_transaction():
    if not ACCESS_TOKEN: return print("\n❌ Error: Debes iniciar sesión primero.")
    url = f"{BASE_URL}/transactions/"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    payload = {
        "description": input("Descripción de la transacción: "),
        "amount": float(input("Monto: ")),
        "type": input("Tipo (income/expense): "),
        "category_id": int(input("ID de la categoría: "))
    }
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)

def update_transaction():
    if not ACCESS_TOKEN: return print("\n❌ Error: Debes iniciar sesión primero.")
    transaction_id = input("ID de la transacción a editar: ")
    url = f"{BASE_URL}/transactions/{transaction_id}"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    payload = {
        "description": input("Nueva descripción (deja en blanco para no cambiar): ") or None,
        "amount": float(input("Nuevo monto (0 para no cambiar): ") or 0) or None
    }
    # Filtramos los valores None para no enviarlos
    payload = {k: v for k, v in payload.items() if v is not None}
    response = requests.put(url, headers=headers, json=payload)
    print_response(response)

def delete_transaction():
    if not ACCESS_TOKEN: return print("\n❌ Error: Debes iniciar sesión primero.")
    transaction_id = input("ID de la transacción a eliminar: ")
    url = f"{BASE_URL}/transactions/{transaction_id}"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    response = requests.delete(url, headers=headers)
    print_response(response)

# --- Funciones de Categorías (CRUD completo para categorías también) ---
def create_category():
    if not ACCESS_TOKEN: return print("\n❌ Error: Debes iniciar sesión primero.")
    url = f"{BASE_URL}/categories/"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    payload = {"name": input("Introduce el nombre de la nueva categoría: ")}
    response = requests.post(url, headers=headers, json=payload)
    print_response(response)

# (Aquí irían las funciones get_categories, update_category, delete_category si las construimos)

def main_menu():
    while True:
        print("\n--- Panel de Pruebas de API ---")
        print(f"Estado: {'CONECTADO' if ACCESS_TOKEN else 'DESCONECTADO'}")
        print("\n-- Autenticación --")
        print("1. Registrar Usuario")
        print("2. Iniciar Sesión")
        print("\n-- Transacciones --")
        print("3. Ver Transacciones")
        print("4. Crear Transacción")
        print("5. Actualizar Transacción")
        print("6. Eliminar Transacción")
        print("\n-- Categorías --")
        print("7. Crear Categoría")
        print("\n-- Sistema --")
        print("8. Salir")
        
        choice = input("Elige una opción: ")
        
        if choice == '1': register_user()
        elif choice == '2': login_user()
        elif choice == '3': get_transactions()
        elif choice == '4': create_transaction()
        elif choice == '5': update_transaction()
        elif choice == '6': delete_transaction()
        elif choice == '7': create_category()
        elif choice == '8': break
        else: print("Opción no válida.")

if __name__ == '__main__':
    main_menu()