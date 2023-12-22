from flask import Blueprint, jsonify, request

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

CancelInvoicesBlueprint = Blueprint("CancelInvoicesBluepring", __name__)

@CancelInvoicesBlueprint.route("/invoices/cancel", methods=["PUT"])
def cancel_invoices():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Authorization header missing"}), 400

    coach = get_coach(token)
    if coach is None:
        return jsonify({"error": "Invalid token"}), 400

    coach_id = coach["coach_id"]
    
    booking_ids = request.json.get("booking_ids")
    
    booking_ids_length = 0
        
    # booking_ids is a csv value of booking ids
    if len(booking_ids.split(',')) > 1:
        booking_ids_tuple = tuple(booking_ids.split(','))
        sql = f"SELECT booking_id FROM Bookings WHERE coach_id = %s AND booking_id IN %s"
        booking_ids_length = len(booking_ids_tuple)
    else :
        booking_ids_tuple = booking_ids
        sql = f"SELECT booking_id FROM Bookings WHERE coach_id = %s AND booking_id = %s"
        booking_ids_length = 1

    response = execute_query(sql, (coach_id, booking_ids_tuple), True)
    
    length = len(response)
    
    if length != booking_ids_length:
        return jsonify({"error": "Invalid booking ids"}), 400
    
    if booking_ids_length == 1:
        
        sql = f"UPDATE Bookings SET invoice_cancelled =1 WHERE booking_id = %s"        
    else:        
        sql = f"UPDATE Bookings SET invoice_cancelled=1 WHERE booking_id IN %s"
    response = execute_query(sql, (booking_ids_tuple,), False)

    return jsonify(message='success'), 200
