from flask import Blueprint, request, jsonify
import re
import time
import hashlib
import logging
from datetime import datetime

logging.basicConfig(level=logging.DEBUG)

from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query
from src.shared.SendEmail import send_email

bookings = Blueprint('bookings', __name__)
# just for ci/cd test again 5
@bookings.route('/timetable/<slug>/booking', methods=['POST'])
def add_booking(slug):

    body = request.json

    try:
        start_time = body['startTime']
        duration = body['duration']
        player_name = body['playerName']
        contact_name = body['contactName']
        is_same_as_player = body['isSameAsPlayerName']
        contact_email = body['email']
        contact_phone_number = body['phoneNumber']
        cost = body['cost']
        rule_id = body['ruleId']
        booking_time = int(time.time())

        if start_time is None or duration is None or player_name is None or \
        (contact_name is None and not is_same_as_player) or contact_email is None \
        or contact_phone_number is None or cost is None or rule_id is None:
            return jsonify(message='Some invalid data was sent'), 400

    except KeyError as e:
        return jsonify(message=f"Invalid/Missing parameter: {e}")
    
    if start_time < time.time():
        return jsonify(message='Cannot book lessons in the past'), 400
    
    # Additional validation checks
    if len(player_name) < 2:
        return jsonify(message="Player name must be longer than 2 characters"), 400
    
    # Validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", contact_email):
        return jsonify(message="Invalid email"), 400

    # Validate phone number format (example format: +12345678900)
    if not re.match(r"^(\+44\d{10}|0\d{10})$", contact_phone_number):
        return jsonify(message="Invalid phone number"), 400
    
    if contact_phone_number.startswith('+44'):
        contact_phone_number = '0' + contact_phone_number[3:]

    # Validate cost as a positive number
    try:
        cost = float(cost)
        if cost <= 0:
            raise ValueError
    except ValueError:
        return jsonify(message="Cost must be a positive number"), 400

    # Validate duration as a positive integer
    try:
        duration = int(duration)
        if duration <= 0:
            raise ValueError
    except ValueError:
        return jsonify(message="Duration must be a positive integer"), 400

    sql = "SELECT coach_id, username, show_email_publicly, show_phone_number_publicly FROM Coaches WHERE slug=%s"
    try:
        result = execute_query(sql, (slug, ))[0]
        coach_id = result[0]
        coach_email = result[1]
        show_email_publicly = result[2]
        show_phone_number_publicly = result[3]
    except IndexError:
        return jsonify(message='Coach with passed slug does not exist'), 400
    
    # check for overlap

    end_time = start_time + duration*60
    sql = """SELECT EXISTS (
        SELECT 1
        FROM Bookings
        WHERE coach_id=%s
        AND start_time<%s
        AND (start_time + duration * 60) > %s
        AND status!="cancelled"
    )"""
    results = execute_query(sql, (coach_id, end_time, start_time))
    if results[0][0]:
        return jsonify(message='Cannot book lesson as it overlaps with an existing one'), 400

    sql = "INSERT INTO Bookings(player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id, hash) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"

    try:
        hash = hash_booking(contact_email, start_time, booking_time)
        execute_query(sql, (player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id, hash))
        
        # need to send confirmation emails to both the coach and the contact email.
        try:
            send_player_confirmation_email(contact_email, start_time, duration, cost, hash, coach_email)
            send_coach_confirmation_email(coach_email, start_time, duration, player_name)
        except Exception as e:
            logging.debug(f"error sending email: {e}")

        return jsonify(message='Success'), 200
    except Exception as e:
        return jsonify(message='Internal Server Error', error={e}), 500
    

def hash_booking(contact_email, start_time, booking_time):
    # Create a new sha256 hash object
    hash_object = hashlib.sha256()

    # Update the hash object with the bytes of the string
    hash_object.update(f"{contact_email}-{start_time}-{booking_time}".encode())

    # Get the hexadecimal representation of the digest
    hashed_value = hash_object.hexdigest()

    return hashed_value

website_url = "http://localhost:3000"

def send_player_confirmation_email(player_email, start_time, duration, cost, hash, coach_email=None, coach_phone_number=None):
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')
    
    # Start constructing the email body with the fixed content
    bodyHTML = f"""
    <html>
        <body>
            <p>Thank you for booking your lesson on {date_str} at {time_str}.</p>
            <p>Summary:</p>
            <p>Duration: {duration} minutes.</p>
            <p>Cost: £{cost/100.0:.2f}.</p>
    """
    
    # Add the coach's email to the body if it is provided
    if coach_email is not None:
        bodyHTML += f"<p>Coach contact email: {coach_email}.</p>"
    
    # Complete the email body with the cancellation link
    bodyHTML += f"""
            <p>To cancel your lesson, <a href="{website_url}/bookings/{hash}/cancel">click here.</a></p>
        </body>
    </html>
    """
    
    send_email(
        localFrom='bookings',
        recipients=[player_email],
        subject='Lesson Successfully Booked!',
        bodyText=f"Thank you for booking your lesson on {date_str} at {time_str} for {duration} minutes.",
        bodyHTML=bodyHTML
    )


def send_coach_confirmation_email(coach_email, start_time, duration, player_name):
    start_time = datetime.fromtimestamp(start_time)
    date_str = start_time.strftime('%A, %B %d, %Y')
    time_str = start_time.strftime('%I:%M %p')
    send_email(
        localFrom='bookings',
        recipients=[coach_email],
        subject='New Lesson Booking!',
        bodyText=f"New booking confirmed at {time_str} on {date_str} for {duration} minutes. Player Name: {player_name}. Check website for more details",
        bodyHTML=f"""
        <html>
            <body>
                <p>New booking confirmed at {time_str} on {date_str} for {duration} minutes</p>
                <p>Player Name: {player_name}</p>
                <p><a href={website_url}>Check website for more details</a></p>
            </body>
        </html>
        """
    )

@bookings.route('/timetable/booking/<booking_id>/cancel', methods=['POST'])
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
    except Exception as e:
        return jsonify(message=f"Missing/Invalid key: {message}"), 400

    sql = "SELECT contact_email, start_time FROM Bookings WHERE booking_id=%s"
    response = execute_query(sql, (booking_id, ))
    if len(response) > 0:
        contact_email, start_time_epoch = response[0]
        start_time = datetime.fromtimestamp(start_time_epoch)
    else:
        return jsonify(message='Invalid booking id'), 400

    sql = "UPDATE Bookings SET status=\"cancelled\", message_from_coach=%s WHERE booking_id=%s"
    execute_query(sql, (message, booking_id))

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
        bodyText=f"Unfortunately you lesson on {date_str} at {time_str} has been cancelled, message from coach: {message}",
        bodyHTML=email_body
    )

    return jsonify(message='Booking successfully cancelled'), 200


@bookings.route('/timetable/player-bookings/<bookingHash>', methods=['GET'])
def get_booking_by_hash(bookingHash):

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


@bookings.route('/timetable/player-bookings/<bookingHash>/cancel', methods=['POST'])
def player_cancel_booking_by_hash(bookingHash):
    
    data = request.json
    try:
        message_to_coach = data['messageToCoach']
    except KeyError as e:
        return jsonify(f"Invalid/Missing Key: {e}")

    sql = "SELECT coach_id, start_time, player_name, status, duration, contact_email, contact_phone_number FROM Bookings WHERE hash=%s"

    results = execute_query(sql, (bookingHash, ))
    if len(results) == 0:
        return jsonify(message='Invalid Hash'), 400
    
    booking = results[0]
    coach_id = booking[0]
    start_time = booking[1]
    player_name = booking[2]
    status = booking[3]
    duration = booking[4]
    contact_email = booking[5]
    contact_phone_number = booking[6]

    if status == 'cancelled':
        return jsonify(message='Lesson Already Cancelled'), 400

    sql = "SELECT username FROM Coaches WHERE coach_id=%s"
    results = execute_query(sql, (coach_id, ))

    if len(results) == 0:
        return jsonify(message='Invalid Hash'), 400
    
    coach_email = results[0][0]

    sql = "UPDATE Bookings SET status=%s, message_from_player=%s WHERE hash=%s"

    execute_query(sql, ('cancelled', message_to_coach, bookingHash))

    send_coach_cancellation_confirmation(start_time, duration, message_to_coach, player_name, contact_email, contact_phone_number, coach_email)
    send_player_cancellation_confirmation(start_time, duration, player_name, contact_email)

    return jsonify(message='Lesson Successfully Cancelled'), 200


def send_coach_cancellation_confirmation(start_time, duration, message_to_coach, player_name, contact_email, contact_phone_number, coach_email):
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