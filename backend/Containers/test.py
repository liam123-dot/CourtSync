import requests
import threading
import time

url = "http://test-api-alb-50414017.eu-west-2.elb.amazonaws.com:8000/timetable/liam-buchanan?from_time=1700438400&to_time=1701043199"

times_taken = []

def task():
    st = time.time()
    response = requests.get(url, verify=False)
    # print(response.status_code)
    et = time.time()
    times_taken.append(et - st)


threads = []
x = 500
for i in range(x):
    threads.append(threading.Thread(target=task))
    threads[i].start()
    
for i in range(x):
    threads[i].join()
    
for i in range(x):
    print(f"{times_taken[i]}s")