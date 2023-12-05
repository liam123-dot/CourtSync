from flask import Flask, request, jsonify, current_app, Blueprint
from src.Users.GetSelf.GetSelf import get_coach

from src.Database.ExecuteQuery import execute_query

GetBookingsBlueprint = Blueprint('GetBookings', __name__)

def get_bookings(coach_id, 
                 from_time=None, 
                 to_time=None, 
                 invoice_sent=None, 
                 invoice_paid=None, 
                 contact_id=None, 
                 player_id=None,
                 status=None
                 ):
    
    args = (coach_id,)
    
    if from_time is not None and to_time is not None:
        time_period = "AND Bookings.start_time >= %s AND Bookings.start_time <= %s"
        args += (from_time, to_time)
    else:
        time_period = ""    
        
    invoice_sent_query = ""
    if invoice_sent is not None:
        invoice_sent_query += "AND Bookings.invoice_sent = %s"
        args += (invoice_sent,)
                
    invoice_paid_query = ""
    if invoice_paid is not None:
        invoice_paid_query += "AND Bookings.paid = %s"
        args += (invoice_paid,)
        
    contact_id_query = ""
    if contact_id is not None:
        contact_id_query += "AND Bookings.contact_id = %s"
        args += (contact_id,)
        
    player_id_query = ""
    if player_id is not None:
        player_id_query += "AND Bookings.player_id = %s"
        args += (player_id,)
                
    status_query = ""
    if status is not None:
        status_query += "AND Bookings.status = %s"
        args += (status,)
                
    sql = f"""
    SELECT Bookings.*,
        Contacts.name AS contact_name,
        Contacts.email AS contact_email,
        Contacts.phone_number AS contact_phone_number,
        Players.name AS player_name,
        GROUP_CONCAT(PricingRules.rule_id) AS pricing_rule_ids
    FROM Bookings
    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
    INNER JOIN Players ON Bookings.player_id = Players.player_id
    LEFT JOIN BookingsPricingJoinTable ON Bookings.booking_id = BookingsPricingJoinTable.booking_id
    LEFT JOIN PricingRules ON BookingsPricingJoinTable.rule_id = PricingRules.rule_id
    WHERE Bookings.coach_id = %s
    {time_period}
    {invoice_sent_query}
    {invoice_paid_query}
    GROUP BY Bookings.booking_id
    """
    
    bookings = execute_query(sql, args, is_get_query=True)

    return bookings


@GetBookingsBlueprint.route('/bookings', methods=['GET'])
def get_bookings_endpoint():
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400

    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    # get from and to time from query string, if provided, otherwise set to None
    
    from_time = request.args.get('from_time')
    to_time = request.args.get('to_time')
    invoice_sent = request.args.get('invoice_sent')
    invoice_paid = request.args.get('invoice_paid')
    
    if invoice_sent:
        invoice_sent = invoice_sent == 'true'
    if invoice_paid:
        invoice_paid = invoice_paid == 'true'
    
    bookings = get_bookings(coach['coach_id'], from_time=from_time, to_time=to_time, invoice_sent=invoice_sent, invoice_paid=invoice_paid)
    
    return jsonify(bookings), 200


