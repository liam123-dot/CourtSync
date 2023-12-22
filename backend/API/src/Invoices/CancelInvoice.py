import stripe
import os

from flask import request, jsonify, Blueprint
from dotenv import load_dotenv

from src.Database.ExecuteQuery import execute_query
from src.Invoices.GetInvoices.GetInvoice import get_invoice
from src.Users.GetSelf.GetSelf import get_coach

load_dotenv('.env')

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')

CancelInvoiceBlueprint = Blueprint('CancelInvoiceBlueprint', __name__)

@CancelInvoiceBlueprint.route('/invoices/<invoice_id>/cancel', methods=['PUT'])
def cancel_invoice(invoice_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'message': 'Missing token'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'message': 'Invalid token'}), 400
    
    invoice = get_invoice(invoice_id)
    
    if coach['coach_id'] != invoice['coach_id']:
        return jsonify({'message': 'Unauthorized'}), 400
    
    if invoice['invoice_cancelled']:
        return jsonify({'message': 'Invoice already cancelled'}), 400
            
    if invoice['paid']:
        return jsonify({'message': 'Invoice already paid'}), 400
    
    sql = "UPDATE Bookings SET invoice_cancelled = 1 WHERE invoice_id = %s"
    
    execute_query(sql, [invoice_id], False)

    if invoice['invoice_sent']:
        
        stripe.Invoice.void_invoice(
            invoice['invoice_id'],
            stripe_account=coach['stripe_account']
            )
        
    return jsonify({'message': 'Invoice cancelled'}), 200
            