from flask import Blueprint, request, jsonify

from src.Database.ExecuteQuery import execute_query

from src.Notifications.Emails.SendEmail import send_email

ContactSalesBlueprint = Blueprint('ContactSales', __name__)

@ContactSalesBlueprint.route('/contact-sales', methods=['POST'])
def contact_sales_endpoint():
    
    data = request.json
    
    # should have a first name, last name, email, phone number, and optional message 
    # return 400 if any of these are missings
    
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    email = data.get('email')
    phone_number = data.get('phoneNumber')
    message = data.get('message', '')  # Optional

    # Check if any required field is missing
    if not all([first_name, last_name, email, phone_number]):
        return jsonify({'error': 'Missing required field'}), 400
    
    success = insert_into_table(first_name, last_name, email, phone_number, message)
    
    if not success:
        return jsonify({'error': 'Enquiry has already been submitted!'}), 400
    
    send_customer_email(first_name, last_name, email)
    
    return jsonify(message='Success'), 200

def check_if_email_exists(email):
    query = """
        SELECT * FROM SalesRequests
        WHERE email = %s
    """
    values = (email,)
    result = execute_query(query, values)
    return len(result) > 0

def insert_into_table(first_name, last_name, email, phone_number, message):
    
    if check_if_email_exists(email):
        return False
    
    query = """
        INSERT INTO SalesRequests (first_name, last_name, email, phone_number, message)
        VALUES (%s, %s, %s, %s, %s)
    """
    values = (first_name, last_name, email, phone_number, message)
    execute_query(query, values, is_get_query=False)
    
    return True
    

def send_customer_email(first_name, last_name, email):
    send_email(
        'enquiries',
        [email],
        "Thank you for your enquiry!",
        f"Dear {first_name} {last_name},\n\nThank you for your enquiry. We will get back to you as soon as possible.\n\nKind regards,\n\nThe CourtSync Team",
        f"""
        <body>
            <p>Dear {first_name} {last_name},</p>
            <p>Thank you for your enquiry. We will get back to you as soon as possible.</p>
            <p>Kind regards,</p>
            <p>The CourtSync Team</p>
        </body>
        """
    )