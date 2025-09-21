import requests
import json

# 1. Pega aquí tu token de acceso válido
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1ODQ4MTcyMSwianRpIjoiMGM1OTg5NzEtNzFkZi00Nzk3LThiOWEtNjk5ZjQ5M2Y4N2IwIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NTg0ODE3MjEsImNzcmYiOiJiZDNjNDhiNS03N2NlLTQ3NDUtYjMwYy05ZDA1ZDk5M2M0ZWMiLCJleHAiOjE3NTg0ODI2MjF9.zNsnUYogRBqYuOD38_zyRiY_mQeXxxpMzz7Yb6XhYXE"

# 2. La URL completa, incluyendo el ID de la transacción que quieres editar (ej: 1)
URL = "http://127.0.0.1:5000/transactions/1"

# 3. La cabecera de autorización es obligatoria
headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}

# 4. El cuerpo con los datos que quieres cambiar
payload = {
    "description": "Café editado desde el script",
    "amount": 2.00
}

# 5. La petición ahora es PUT
print(f"Enviando petición PUT a: {URL}")
response = requests.put(URL, headers=headers, json=payload) # <- Usamos requests.put

# 6. Imprimimos el resultado
print(f"Status Code: {response.status_code}")
print("Response JSON:")
try:
    print(response.json())
except json.JSONDecodeError:
    print(response.text)