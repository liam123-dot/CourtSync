from flask import Blueprint, request, jsonify
import logging
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)
import logging
from datetime import datetime
from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query
from src.shared.SendEmail import send_email

bookings_cancelling_blueprint = Blueprint('bookings', __name__)


logging.basicConfig(level=logging.DEBUG)

bookings_cancelling_blueprint = Blueprint('bookings', __name__)

# ------------------- Cancelling by Coach ------------------- #

@bookings_cancelling_blueprint.route('/timetable/booking/<booking_id>/cancel', methods=['POST'])
def coach_cancel_lesson(booking_id):
    token = request.headers.get('Authorization', None)
    
    username = None
    if token:
        valid, username = get_access_token_username(token)
    else:
        return jsonify(message='No token provided'), 400
    
    if not valid:
        return jsonify(message='Unauthorised'), 400
    
    data = request.json
    try:
        message = data['message_to_player']
    except KeyError as e:
        return jsonify(message=f"Missing/Invalid key: {e}"), 400

    booking = get_booking_by_id(booking_id)
    if not booking:
        return jsonify(message='Invalid booking id'), 400

    contact_email, start_time = booking

    cancel_booking(booking_id, message)

    try:
        send_player_cancellation_by_coach_confirmation_email(contact_email, start_time, message)
    except Exception as e:
        logging.error(f"Error sending email: {e}")
        send_player_cancellation_by_coach_confirmation_email(contact_email, start_time, message)

    return jsonify(message='Booking successfully cancelled'), 200

def get_booking_by_id(booking_id):
    sql = "SELECT contact_email, start_time FROM Bookings WHERE booking_id=%s"
    response = execute_query(sql, (booking_id, ))
    if len(response) > 0:
        contact_email, start_time_epoch = response[0]
        start_time = datetime.fromtimestamp(start_time_epoch)
        return contact_email, start_time
    else:
        return None

def cancel_booking(booking_id, message):
    sql = "UPDATE Bookings SET status=\"cancelled\", message_from_coach=%s WHERE booking_id=%s"
    execute_query(sql, (message, booking_id))

def send_player_cancellation_by_coach_confirmation_email(contact_email, start_time, message):
        
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

# ------------------- Get booking by hash ------------------- #

@bookings_cancelling_blueprint.route('/timetable/player-bookings/<bookingHash>', methods=['GET'])
def get_booking_by_hash_endpoint(bookingHash):

    sql = "SELECT player_name, contact_name, duration, start_time, cost, status FROM Bookings WHERE hash=%s"

    results = execute_query(sql, (bookingHash, ))

    if len (results) == 0:
        return jsonify(message='Invalid link, no booking exists'), 400
    
    booking = results[0]
    player_name = booking[0]
    contact_name = booking[1]
    duration = booking[2]
    start_time = booking[3]
    cost = booking[4]
    status = booking[5]

    if status == 'cancelled':
        return jsonify(message='This lesson has already been cancelled'), 400

    return jsonify(
        player_name=player_name,
        contact_name=contact_name,
        duration=duration,
        start_time=start_time,
        cost=cost,
        status=status
    ), 200

# ------------------- Cancelling by Player ------------------- #

@bookings_cancelling_blueprint.route('/timetable/player-bookings/<bookingHash>/cancel', methods=['POST'])
def player_cancel_booking_by_hash(bookingHash):
    data = request.json
    message_to_coach = data.get('messageToCoach')
    if not message_to_coach:
        return jsonify(f"Invalid/Missing Key: messageToCoach"), 400

    booking = get_booking_by_hash(bookingHash)
    if not booking:
        return jsonify(message='Invalid Hash'), 400

    if booking['status'] == 'cancelled':
        return jsonify(message='Lesson Already Cancelled'), 400

    coach_email = get_coach_email_by_id(booking['coach_id'])
    if not coach_email:
        return jsonify(message='Invalid Hash'), 400

    update_booking_status(bookingHash, 'cancelled', message_to_coach)

    send_coach_cancellation_confirmation(booking['start_time'], booking['duration'], message_to_coach, booking['player_name'], booking['contact_email'], booking['contact_phone_number'], coach_email)
    send_player_cancellation_confirmation(booking['start_time'], booking['duration'], booking['player_name'], booking['contact_email'])

    return jsonify(message='Lesson Successfully Cancelled'), 200

def get_booking_by_hash(bookingHash):
    sql = "SELECT coach_id, start_time, player_name, status, duration, contact_email, contact_phone_number FROM Bookings WHERE hash=%s"
    results = execute_query(sql, (bookingHash, ))
    if len(results) == 0:
        return None
    return {
        'coach_id': results[0][0],
        'start_time': results[0][1],
        'player_name': results[0][2],
        'status': results[0][3],
        'duration': results[0][4],
        'contact_email': results[0][5],
        'contact_phone_number': results[0][6]
    }

def get_coach_email_by_id(coach_id):
    sql = "SELECT username FROM Coaches WHERE coach_id=%s"
    results = execute_query(sql, (coach_id, ))
    if len(results) == 0:
        return None
    return results[0][0]

def update_booking_status(bookingHash, status, message_to_coach):
    sql = "UPDATE Bookings SET status=%s, message_from_player=%s WHERE hash=%s"
    execute_query(sql, (status, message_to_coach, bookingHash))


def send_coach_cancellation_confirmation(start_time, duration, message_to_coach, player_name, contact_email, contact_phone_number, coach_email):
    # function to send email to coach confirming lesson cancellation
    end_time = datetime.fromtimestamp(start_time + (duration * 60))
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    start_time_str = start_time.strftime('%I:%M %p')

    end_time_str = end_time.strftime('%I:%M %p')

    email_body = f"""
    <html>
        <body>
            <p>Your lesson on {date_str} from {start_time_str} to {end_time_str} with {player_name} has been cancelled</p>
            <p>Message from Player:</p>
            <p>{message_to_coach}</p>
            <p>Players Contact Details if you would like to get in contact:</p>
            <p><b>Email:</b> {contact_email}</p>
            <p><b>Phone Number:</b> {contact_phone_number}</p>
        </body>
    </html>
    """

    send_email(
        localFrom='cancellations',
        recipients=[coach_email],
        subject="Lesson Cancellation",
        bodyText=f"Unfortunately you lesson on {date_str} at {start_time_str} with {player_name} has been cancelled, message from Player: {message_to_coach}",
        bodyHTML=email_body
    )

def send_player_cancellation_confirmation(start_time, duration, player_name, contact_email):
    end_time = datetime.fromtimestamp(start_time + (duration * 60))
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    start_time_str = start_time.strftime('%I:%M %p')

    end_time_str = end_time.strftime('%I:%M %p')

    send_email(
        localFrom='cancellations',
        recipients=[contact_email],
        subject='Lesson Cancellation Confirmation',
        bodyText=f"Your lesson on {date_str} at {start_time_str} until {end_time_str} for {player_name} has successfully been cancelled",
        bodyHTML=f"""
            <html>
                <body>

                    <p>Your lesson on {date_str} at {start_time_str} until {end_time_str} for {player_name} has successfully been cancelled</p>

                </body>
            </html>
        """
    )