import requests
import os
import time

from jose import jwk, jwt
from jose.utils import base64url_decode


class AppConfig:
    def __init__(self):
        self.user_pool_id = os.getenv('USER_POOL_ID')
        self.cognito_region = 'eu-west-2'
        self.client_id = os.getenv('CLIENT_ID')
        self.keys = None

    def get_jwks_keys(self):
        if not self.keys:
            keys_url = f'https://cognito-idp.{self.cognito_region}.amazonaws.com/{self.user_pool_id}/.well-known/jwks.json'
            self.keys = requests.get(keys_url).json()['keys']
        return self.keys


config = AppConfig()


def get_access_token_username(token):
    # get the kid from the headers prior to verification
    headers = jwt.get_unverified_headers(token)
    kid = headers['kid']
    keys = config.get_jwks_keys()


    # search for the kid in the downloaded public keys
    key_index = -1
    for i in range(len(keys)):
        if kid == keys[i]['kid']:
            key_index = i
            break
    if key_index == -1:
        print('Public key not found in jwks.json')
        return False, None
    
    # construct the public key
    public_key = jwk.construct(keys[key_index])

    # get the last two sections of the token,
    # message and signature (encoded in base64)
    message, encoded_signature = str(token).rsplit('.', 1)

    # decode the signature
    decoded_signature = base64url_decode(encoded_signature.encode('utf-8'))

    # verify the signature
    if not public_key.verify(message.encode("utf8"), decoded_signature):
        print('Signature verification failed')
        return False, None
    print('Signature successfully verified')

    # since we passed the verification, we can now safely
    # use the unverified claims
    claims = jwt.get_unverified_claims(token)

    # additionally we can verify the token expiration
    if time.time() > claims['exp']:
        print('Token is expired')
        return False, None
    print(claims)

    # and the Audience  (use claims['client_id'] if verifying an access token)
    return True, claims['username']
