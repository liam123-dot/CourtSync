from flask import request, jsonify, Blueprint
from dotenv import load_dotenv

from src.Database.ExecuteQuery import execute_query

import os
import stripe

InvoicePaidWebhookBlueprint = Blueprint('InvoicePaidWebhookBlueprint', __name__)

load_dotenv('.env')

stripe_secret_key = os.getenv('STRIPE_SECRET_KEY')

stripe.api_key = stripe_secret_key

@InvoicePaidWebhookBlueprint.route('/invoice/paid', methods=['POST'])
def invoice_paid_webhook():
    
    try:
        data = request.json
        
        invoice_id = data['data']['object']['id']
        
        mark_booking_paid(invoice_id)
            
        return jsonify(message='Invoice paid webhook received'), 200
    
    except Exception as e:
        return jsonify(message='Error', error=e)

def mark_booking_paid(invoice_id):
    sql = "UPDATE Bookings SET paid=1 WHERE invoice_id=%s"
    execute_query(sql, (invoice_id,), is_get_query=False)