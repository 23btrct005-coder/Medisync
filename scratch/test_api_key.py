import requests

API_KEY = "AIzaSyDKFDakzgMgcHol8PQijByDzFuyRty91VA"
URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key={API_KEY}"

payload = {
    "contents": [{
        "parts": [{"text": "Hello, this is a test."}]
    }]
}

response = requests.post(URL, json=payload)
print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
