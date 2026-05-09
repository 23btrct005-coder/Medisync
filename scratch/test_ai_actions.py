import requests

# Test Agentic Action Execution
BASE_URL = "https://medisync-hos.ddns.net/api/ai/execute/action"
# Note: In a real test, you'd need a valid JWT token
TOKEN = "YOUR_JWT_TOKEN_HERE"

def test_booking_action():
    payload = {
        "action": "book_appointment",
        "params": {
            "doctorId": 1,
            "date": "2026-05-15",
            "slot": "10:00 AM",
            "type": "ONLINE"
        }
    }
    
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    # This is a simulation since I don't have a live token in scratch
    print(f"Testing endpoint: {BASE_URL}")
    print(f"Payload: {payload}")
    # response = requests.post(BASE_URL, json=payload, headers=headers)
    # print(f"Status: {response.status_code}")
    # print(f"Body: {response.json()}")

if __name__ == "__main__":
    test_booking_action()
