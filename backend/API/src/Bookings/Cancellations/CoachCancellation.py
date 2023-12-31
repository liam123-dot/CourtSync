from flask import Blueprint, request, jsonify, current_app
from datetime import datetime

from src.Bookings.GetBooking import get_booking

from src.Database.ExecuteQuery import execute_query

from src.Notifications.Emails.SendEmail import send_email
from src.Users.GetSelf.GetSelf import get_coach


CoachCancellationBlueprint = Blueprint('CoachCancellation', __name__)

@CoachCancellationBlueprint.route('/timetable/booking/<booking_id>/cancel', methods=['POST'])
def coach_cancel_lesson(booking_id):
    token = request.headers.get('Authorization', None)
    
    if token:
        coach = get_coach(token)
    else:
        return jsonify(message='No token provided'), 400
    
    if not coach:
        return jsonify(message='Unauthorised'), 400
    
    data = request.json
    try:
        message = data['message_to_player']
    except KeyError as e:
        return jsonify(message=f"Missing/Invalid key: {e}"), 400

    booking = get_booking(booking_id)
    if not booking:
        return jsonify(message='Invalid booking id'), 400
    
    if booking['coach_id'] != coach['coach_id']:
        return jsonify(message='Unauthorised'), 400

    contact_email, start_time = booking['contact_email'], booking['start_time']
    
    cancel_repeats = request.args.get('cancel_repeats', False)
    
    cancel_repeats = True if cancel_repeats == 'true' else False
    
    cancel_booking(booking_id, message, cancel_repeats)

    if cancel_repeats:
        pass
    else:
        try:
            send_player_cancellation_by_coach_confirmation_email(contact_email, start_time, message)
        except Exception as e:
            send_player_cancellation_by_coach_confirmation_email(contact_email, start_time, message)

    return jsonify(message='Booking successfully cancelled'), 200


def get_booking_by_id(booking_id, coach_id):
    connection = current_app.config['db_connection'].connection
    sql = "SELECT contact_email, start_time FROM Bookings WHERE booking_id=%s AND status='confirmed' AND coach_id=%s"
    with connection.cursor() as cursor:
        cursor.execute(sql, (booking_id, coach_id))
        response = cursor.fetchall()
    if len(response) > 0:
        contact_email, start_time_epoch = response[0]
        start_time = datetime.fromtimestamp(start_time_epoch)
        return contact_email, start_time
    else:
        return None

def cancel_booking(booking_id, message, cancel_repeats=False):
    
    if cancel_repeats:
    
        booking = get_booking(booking_id)
        
        repeat_id = booking['repeat_id']
        
        sql = "UPDATE Bookings SET status='cancelled', message_from_coach=%s WHERE repeat_id=%s AND start_time >= %s"
        
        execute_query(sql, args=(message, repeat_id, booking['start_time']), is_get_query=False)
    
    else:
        sql = "UPDATE Bookings SET status='cancelled', message_from_coach=%s WHERE booking_id=%s"
        
        execute_query(sql, args=(message, booking_id), is_get_query=False)
    

def send_player_cancellation_by_coach_confirmation_email(contact_email, start_time, message):
    
    start_time = datetime.fromtimestamp(start_time)

    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')

    email_body = f"""
    <html>
        <body>
            <p>Unfortunately, your lesson on {date_str} at {time_str} has been cancelled.</p>
            <p>Message from Coach:</p>
            <p>{message}</p>
        </body>
    </html>
    """
    
    send_email(
        localFrom='cancellations',
        recipients=[contact_email],
        subject="Lesson Cancellation",
        bodyText=f"Unfortunately your lesson on {date_str} at {time_str} has been cancelled, message from coach: {message}",
        bodyHTML=email_body
    )