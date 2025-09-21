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

def register_user():
    url = f"{BASE_URL}/auth/register"
    payload = {
        "name": input("Introduce el nombre: "),
        "email": input("Introduce el email: "),
        "password": input("Introduce la contraseña: ")
    }
    response = requests.post(url, json=payload)
    print_response(response)

def login_user():
    global ACCESS_TOKEN
    url = f"{BASE_URL}/auth/login"
    payload = {
        "email": input("Introduce tu email: "),
        "password": input("Introduce tu contraseña: ")
    }
    response = requests.post(url, json=payload)
    print_response(response)
    if response.status_code == 200:
        ACCESS_TOKEN = response.json().get('access_token')
        print("✅ ¡Token de acceso guardado!")

def get_transactions():
    if not ACCESS_TOKEN:
        print("\n❌ Error: Debes iniciar sesión primero (opción 2).")
        return
    url = f"{BASE_URL}/transactions/"
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    response = requests.get(url, headers=headers)
    print_response(response)

def main_menu():
    while True:
        print("\n--- Panel de Pruebas de API ---")
        if ACCESS_TOKEN:
            print("Estado: CONECTADO (Token guardado)")
        else:
            print("Estado: DESCONECTADO")
        print("1. Registrar un nuevo usuario")
        print("2. Iniciar sesión (Obtener Token)")
        print("3. Ver mis transacciones")
        print("4. Salir")
        
        choice = input("Elige una opción: ")
        
        if choice == '1':
            register_user()
        elif choice == '2':
            login_user()
        elif choice == '3':
            get_transactions()
        elif choice == '4':
            break
        else:
            print("Opción no válida.")

if __name__ == '__main__':
    main_menu()