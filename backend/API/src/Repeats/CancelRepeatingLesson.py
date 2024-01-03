
from flask import request, jsonify, Blueprint

from src.Bookings.GetBooking import get_booking
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

CancelRepeatingLessonBlueprint = Blueprint('CancelRepeatingLessonBlueprint', __name__)

@CancelRepeatingLessonBlueprint.route('/timetable/repeats/<booking_id>/cancel', methods = ['POST'])
def cancel_repeats(booking_id):

    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='Missing token'), 400
    
    coach = get_coach(token)
    if not coach:
        return jsonify(message='Invalid token'), 400
    
    booking = get_booking(booking_id)
    
    if not booking:
        return jsonify(message='Invalid booking ID'), 400
    
    if booking['coach_id'] != coach['coach_id']:
        return jsonify(message='Invalid booking ID'), 400
    
    if booking['repeat_id'] is None:
        return jsonify(message='Booking is not repeating'), 400
    
    update_repeat_until(booking['repeat_id'], booking['start_time'] - booking['duration'] * 60)
    
    return jsonify({
        'status': 'success',
        'message': 'Successfully cancelled repeating lesson'
    }), 200

def update_repeat_until(repeat_id, repeat_until):
    
    sql = "UPDATE RepeatRules SET repeat_until = %s WHERE repeat_id = %s"

    execute_query(sql, (repeat_until, repeat_id), False)
