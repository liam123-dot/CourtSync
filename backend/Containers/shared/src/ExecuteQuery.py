import requests
import logging

logging.basicConfig(level=logging.DEBUG)

def execute_query(query, args=None):

    print(f"Executing Query: {query}")
    
    # make sure if args is passed, it is either a list or a tuple
    if args:
        if not isinstance(args, (list, tuple)):
            raise ValueError("args must be a list or tuple")
        if len(args) == 1:
            raise ValueError("args must have more than one element")
    
    response = requests.post('http://db-service.default.svc.cluster.local:8000/query', json={
        "query": query,
        "args": args
    })

    logging.debug(f"Query: {query}")
    logging.debug(f"Query Response: {response}, data: {response.text}")

    if response.ok:
        return response.json()['response']
    else:
        raise Exception(response.json()['message'])
