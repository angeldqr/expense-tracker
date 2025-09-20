import requests
import json

# Your valid access token from the login endpoint
ACCESS_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc1ODMzMzU2MCwianRpIjoiNzllYjI3ZjAtZjA4MS00ZmMxLTkyNjYtNzg2NjQyMTU0ZjllIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6IjEiLCJuYmYiOjE3NTgzMzM1NjAsImNzcmYiOiI0MDM3Y2Q1Zi05NmQ3LTQwMzQtYmZkMC1lMjhkZmYyYjIyMTIiLCJleHAiOjE3NTgzMzQ0NjB9.jfZ_znUQoKJnVDa2hGZ45hgGwHMHPV2K-aURvDgZOlI"

# The URL for creating transactions
URL = "http://127.0.0.1:5000/transactions/"

headers = {
    "Authorization": f"Bearer {ACCESS_TOKEN}"
}

# The transaction data, using the ID of the category we just created
payload = {
    "description": "Almuerzo de trabajo",
    "amount": 15.50,
    "type": "expense",
    "category_id": 1  # <-- This now exists and belongs to you
}

print(f"Enviando petición POST a: {URL}")
response = requests.post(URL, headers=headers, json=payload)

print(f"Status Code: {response.status_code}")
print("Response JSON:")
print(response.json())