from flask import jsonify, Blueprint, request
import random
import time

from src.Notifications.Emails.SendEmail import send_email

from src.Database.ExecuteQuery import execute_query

VerifyEmailBlueprint = Blueprint('VerifyEmailBlueprint', __name__)

@VerifyEmailBlueprint.route('/contacts/verify-email', methods=['POST'])
def verify_email_endpoint():
    
    data = request.json
    
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'Missing email'}), 400
    
    code, expiry = create_code(email)
    
    send_email(
        localFrom="verification",
        recipients=[email],
        subject="Verify your email",
        bodyText="Your verification code is: " + str(code),
        bodyHTML="""<html>
        <head></head>
        <body>
          <p>Your verification code is: """ + str(code) + """</p>
          <p>This code will expire in 5 minutes</p>
        </body>
        </html>"""
    )
    
    return jsonify(success=True, expiry=expiry), 200

@VerifyEmailBlueprint.route('/contacts/confirm-email', methods=['POST'])
def confirm_email_endpoint():
    
    data = request.json
    
    email = data.get('email')
    code = data.get('code')
    
    if not email:
        return jsonify({'error': 'Missing email'}), 400
    
    if not code:
        return jsonify({'error': 'Missing code'}), 400
    
    valid_code, message = check_code(email, code)
    
    if valid_code:
        return jsonify(success=True), 200
    
    return jsonify(error=message), 400
    


def check_code(email, code):
        
    result = execute_query("SELECT code, expiry FROM VerificationEmails WHERE email = %s", (email,))
    
    if not result:
        return False, 'Error'
    
    if result[0]['code'] != code:
        return False, 'Incorrect code'
    
    if result[0]['expiry'] < time.time():
        return False, 'Code expired'
    
    return True, None


def create_code(email):
    
    code = random.randint(100000, 999999)
    expiry = str(int(time.time() + 300))
    
    execute_query("INSERT INTO VerificationEmails (email, code, expiry) VALUES (%s, %s, %s) ON DUPLICATE KEY UPDATE code=%s, expiry=%s", (email, code, expiry, code, expiry), is_get_query=False)
    
    return code, expiry

    