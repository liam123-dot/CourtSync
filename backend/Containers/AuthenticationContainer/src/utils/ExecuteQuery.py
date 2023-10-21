import requests
import logging

logging.basicConfig(level=logging.DEBUG)

def execute_query(query, args=None):

    print(f"Executing Query: {query}")
    
    response = requests.post('http://db-service.default.svc.cluster.local:8000/query', json={
        "query": query,
        "args": args
    })

    logging.debug(f"Query Response: {response}, data: {response.text}")

    if response.ok:
        return response.json()['response']
    else:
        return response.json()['message']
