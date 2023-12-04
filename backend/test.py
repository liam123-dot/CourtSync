import requests
import threading
import time

url = "https://api-test.courtsync.co.uk:8000/timetable/liam-buchanan?from_time=1701043200&to_time=1701647999"

response = requests.get(url)

print(response)

x = 80

def test():
    st = time.time()
    response = requests.get(url)
    print(response)
    # print(response.json())
    et = time.time()
    
    print(et - st)
    
# test how many requests can be made at once
for i in range (600):
    for i in range(x):
        threading.Thread(target=test).start()
    time.sleep(1)
# test()