from flask import request, jsonify, Blueprint
from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query

EditBooking = Blueprint('EditBooking', __name__)

@EditBooking.route('/timetable/bookings/<booking_id>/extra-costs', methods=['PUT'])
def edit_booking_extra_costs(booking_id):
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'message': 'Unauthorised'}), 401

    valid, username = get_access_token_username(token)
    
    if not valid:
        return jsonify({'message': 'Unauthorised'}), 401
    
    data = request.json
    
    try:
        extra_costs = data['extra_costs']
    except KeyError as e:
        return jsonify({'message': f"Invalid/Missing key: {e}"}), 400
    
    # Check if extra_costs is a valid integer
    try:
        extra_costs = int(extra_costs)
    except ValueError:
        return jsonify({'message': 'Invalid extra costs value'}), 400
    
    sql = "UPDATE Bookings SET extra_costs = %s WHERE booking_id = %s"
    execute_query(sql, (extra_costs, booking_id))
    
    return jsonify({'message': 'Extra costs updated'}), 200
