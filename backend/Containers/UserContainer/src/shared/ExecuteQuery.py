import requests
import logging

logging.basicConfig(level=logging.DEBUG)

# now tested

def execute_query(query, args=None):

    logging.debug(f"Executing Query: {query}, with args: {args}")
    
    # make sure if args is passed, it is either a list or a tuple
    if args:
        if not isinstance(args, (list, tuple)):
            raise ValueError("args must be a list or tuple")

    response = requests.post('http://db-service.default.svc.cluster.local:8000/query', json={
        "query": query,
        "args": args
    })

    logging.debug(f"Query: {query}")
    logging.debug(f"Query Response: {response}, data: {response.text}")

    if response.ok:
        return response.json()['response']
    else:
        logging.debug(f"Query: {query}, args: {args}, response: {response}")
        raise Exception(response.json()['message'])
