from src.shared.ExecuteQuery import execute_query
from src.shared.CheckAuthorization import get_access_token_username
import logging
import requests

logging.basicConfig(level=logging.DEBUG)

# now tested

def get_self(authorization):
    
    # make sure if args is passed, it is either a list or a tuple    
    
    if not authorization:
        return None

    response = requests.get('http://user-service.default.svc.cluster.local:8000/user/me', headers={
        'Authorization': authorization
    })

    if response.ok:
        return response.json()
    else:
        return None
