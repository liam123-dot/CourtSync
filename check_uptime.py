import requests
import time

url = 'https://api-test.courtsync.co.uk:8000/'

while True:
    try:
        response = requests.get(url)

        print(response.text)
    except Exception as e:
        print(e)
        pass
    time.sleep(1)
