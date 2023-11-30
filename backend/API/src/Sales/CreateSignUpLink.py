
from flask import Blueprint, request, jsonify

from src.Database.ExecuteQuery import execute_query
from src.Notifications.Emails.SendEmail import send_email

from dotenv import load_dotenv

load_dotenv('.env')

import time
import hashlib
import os

CreateSignUpLinkBlueprint = Blueprint('CreateSignUpLink', __name__)

@CreateSignUpLinkBlueprint.route('/sales/<email>/link', methods=['POST'])
def create_sign_up_link(email):
        
    # should have a first name, last name, email, phone number, and optional message 
    # return 400 if any of these are missings
    
    user_exists = check_user_exists(email)
    
    if user_exists:
        return jsonify({'error': 'Email already exists'}), 400
        
    expiry = int(time.time()) + 60 * 60 * 24
    
    code = create_hash(email, expiry)
    
    insert_into_table(code, email, expiry)
    
    send_invitation_email(email, code)
    
    return jsonify(message='Success'), 200
    
    
def check_user_exists(email):
    query = "SELECT name FROM Coaches WHERE email = %s"
    
    result = execute_query(query, (email,))
    
    if len(result) == 0:
        return False
    
    return True
    

def create_hash(email, expiry):
    # Create a new sha256 hash object
    hash_object = hashlib.sha256()

    # Update the hash object with the bytes of the string
    hash_object.update(f"{email}-{expiry}".encode())

    # Get the hexadecimal representation of the digest
    hashed_value = hash_object.hexdigest()
    
    return hashed_value


def insert_into_table(hash, email, expiry):
    sql = "INSERT INTO SignUpCodes (hash, email, expiry) VALUES (%s, %s, %s)"
    
    execute_query(sql, (hash, email, expiry), is_get_query=False)
    
    
def send_invitation_email(to_email, hash):
    
    send_email(
        localFrom='sign-up',
        recipients=[to_email],
        subject='Sign up for CourtSync',
        bodyText=f"Click the link to sign up for CourtSync: {os.environ['WEBSITE_URL']}/#/coach/signup/{hash}, this link will expire in 24 hours",
        bodyHTML=f"""
            <body>
                <p>Click the link to sign up for CourtSync: <a href="{os.environ['WEBSITE_URL']}/#/coach/signup/{hash}">{os.environ['WEBSITE_URL']}/#/signup/{hash}</a></p>
                <p>This link will expire in 24 hours</p>
            </body>
        """
    )