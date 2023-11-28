from datetime import datetime
from flask import Blueprint, request, jsonify, current_app

from src.Notifications.Emails.SendEmail import send_email
from src.Users.GetSelf.GetSelf import get_attributes

PlayerCancelBookingBlueprint = Blueprint('bookings', __name__)

@PlayerCancelBookingBlueprint.route('/timetable/player-bookings/<bookingHash>/cancel', methods=['POST'])
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

    coach = get_attributes(booking['coach_id'])
    if not coach:
        return jsonify(message='Invalid Hash'), 400
    
    coach_email = coach['email']

    update_booking_status(bookingHash, 'cancelled', message_to_coach)

    send_coach_cancellation_confirmation(booking['start_time'], booking['duration'], message_to_coach, booking['player_name'], booking['contact_email'], booking['contact_phone_number'], coach_email)
    send_player_cancellation_confirmation(booking['start_time'], booking['duration'], booking['player_name'], booking['contact_email'])

    return jsonify(message='Lesson Successfully Cancelled'), 200

def get_booking_by_hash(bookingHash):
    connection = current_app.config['db_connection'].connection
    sql = "SELECT coach_id, start_time, player_name, status, duration, contact_email, contact_phone_number FROM Bookings WHERE hash=%s"
    with connection.cursor() as cursor:
        cursor.execute(sql, (bookingHash, ))
        results = cursor.fetchall()
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

def update_booking_status(bookingHash, status, message_to_coach):
    connection = current_app.config['db_connection'].connection
    sql = "UPDATE Bookings SET status=%s, message_from_player=%s WHERE hash=%s"
    with connection.cursor() as cursor:
        cursor.execute(sql, (status, message_to_coach, bookingHash))
    connection.commit()


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
    
@PlayerCancelBookingBlueprint.route('/timetable/player-bookings/<bookingHash>', methods=['GET'])    
def get_booking_by_hash_endpoint(bookingHash):
    connection = current_app.config['db_connection'].connection
    sql = "SELECT player_name, contact_name, duration, start_time, cost, status FROM Bookings WHERE hash=%s"

    with connection.cursor() as cursor:
        cursor.execute(sql, (bookingHash, ))
        results = cursor.fetchall()

    if len(results) == 0:
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