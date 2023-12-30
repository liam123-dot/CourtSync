import requests
import time

url = 'https://api-test.courtsync.co.uk:8000/'

while True:
    try:
        st = time.time()
        response = requests.get(url)
        et = time.time()

        print(f"{response.text}, time taken: {(et - st):.2f}s")
    except Exception as e:
        print(e)
        pass
    time.sleep(0.1)
