from flask import request, jsonify, Blueprint
import stripe
import os
from dotenv import load_dotenv
load_dotenv('.env')

stripe.api_key = os.environ['STRIPE_SECRET_KEY']

from src.Users.GetSelf.GetSelf import get_coach
from src.Database.ExecuteQuery import execute_query

MarkInvoiceAsPaidBlueprint = Blueprint('MarkInvoiceAsPaid', __name__)

@MarkInvoiceAsPaidBlueprint.route('/invoices/<invoice_id>/paid', methods=['POST'])
def mark_invoice_as_paid(invoice_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 401
    
    stripe_account_id = coach['stripe_account'] 
    
    invoice = stripe.Invoice.retrieve(
        invoice_id,
        stripe_account=stripe_account_id
    )

    if not invoice:
        return jsonify({'error': 'Invalid invoice ID'}), 400
    
    invoice = stripe.Invoice.pay(
        invoice_id,
        paid_out_of_band=True,
        stripe_account=stripe_account_id
    )
    
    execute_query(
        "UPDATE Bookings set paid=1, paid_from='outside stripe' WHERE invoice_id = %s",
        (invoice_id,),
        False   
    )
    
    return jsonify({'success': True}), 200
    
@MarkInvoiceAsPaidBlueprint.route('/invoices/paid', methods=['POST'])
def mark_invoices_as_paid_not_sent():
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 401
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 401
    
    booking_ids = request.json.get("booking_ids")
    
    if not booking_ids:
        return jsonify({"error": "No booking IDs provided"}), 400

    booking_ids_length = 0
    
    if len(booking_ids.split(',')) > 1:
        booking_ids_tuple = tuple(booking_ids.split(','))
        sql = "SELECT booking_id FROM Bookings WHERE coach_id = %s AND booking_id IN %s"
        booking_ids_length = len(booking_ids_tuple)
    else:
        booking_ids_tuple = (booking_ids,)
        sql = "SELECT booking_id FROM Bookings WHERE coach_id = %s AND booking_id = %s"
        booking_ids_length = 1

    response = execute_query(sql, (coach["coach_id"], booking_ids_tuple), True)
    
    if len(response) != booking_ids_length:
        return jsonify({"error": "Invalid booking ids"}), 400
    
    update_sql = "UPDATE Bookings SET paid=1, paid_from='outside stripe' WHERE booking_id IN %s"
    execute_query(update_sql, (booking_ids_tuple,), False)

    return jsonify({'success': True}), 200
