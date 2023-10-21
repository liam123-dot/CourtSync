import requests

response = requests.post('http://127.0.0.1:5000/query', json={
    "query": "blah",
    "args": (1, 2)
})

print(response)
print(response.text)