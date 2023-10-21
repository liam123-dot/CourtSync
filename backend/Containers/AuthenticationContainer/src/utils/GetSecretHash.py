import hmac
import hashlib
import base64
import logging

logging.basicConfig(level=logging.DEBUG)

def get_secret_hash(username, client_id, client_secret):
    message = bytes(username + client_id, 'utf-8')
    client_secret = bytes(client_secret, 'utf-8')
    secret_hash = base64.b64encode(hmac.new(client_secret, message, digestmod=hashlib.sha256).digest()).decode() 
    return secret_hash
