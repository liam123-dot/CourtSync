import requests
import os

instance_url = os.environ['INTEGRATION_INSTANCE_URL']

def test_sign_in():
    url = f"{instance_url}/coach/signin"
    payload = {
        "username": "liambuchanan358@yahoo.co.uk",
        "password": "Testpassword123!"
    }
    requests.post(url, json=payload)
