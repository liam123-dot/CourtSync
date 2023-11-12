from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import hashlib
import time
import re

logging.basicConfig(level=logging.DEBUG)

from src.shared.ExecuteQuery import execute_query
from src.shared.SendEmail import send_email
from src.shared.GetCoachDetails import get_user_attributes

website_url = 'http://localhost:3000'

add_booking_blueprint = Blueprint('player_add_booking', __name__)

@add_booking_blueprint.route('/timetable/<slug>/booking', methods=['POST'])
def add_booking(slug):
    
    # inputs should be startTime, duration, playerName, contactName, isSameAsPlayerName, email, phoneNumber, cost, ruleId,
    # each of these are required
    
    body = request.json
    
    try:
        start_time = body['startTime']
        duration = int(body['duration'])
        player_name = body['playerName']
        contact_name = body['contactName']
        is_same_as_player_name = body['isSameAsPlayerName']
        contact_email = body['email']
        contact_phone_number = body['phoneNumber']
        cost = body['cost']
        rule_id = body['ruleId']
        booking_time = int(time.time())
    except KeyError as e:
        return jsonify(message=f"Missing required field: {e}"), 400
    
    try:
    
        inputs_valid, message = validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id)
            
        if not inputs_valid:
            return jsonify(message=message), 400
        
        if contact_phone_number.startswith("+44"):
            contact_phone_number = contact_phone_number[3:]
        
        coach_id, coach_email, show_email_publicly, show_phone_number_publicly = fetch_coach(slug)
        
        if not coach_id:
            return jsonify(message="Coach not found"), 404
        
        overlapping = check_for_overlap(start_time, duration, coach_id)
        
        if overlapping:
            return jsonify(message="Booking overlaps with another booking"), 400
        
        lesson_hash = insert_booking(player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id, booking_time)
        
        if not lesson_hash:
            return jsonify(message="Error inserting booking"), 500
    
        try:
            send_confirmation_emails(contact_email, start_time, duration, cost, lesson_hash, player_name, show_email_publicly, show_phone_number_publicly, coach_id)
        except Exception as e:
            logging.error(f"Error sending confirmation emails: {e}")

    except Exception as e:
        logging.error(f"Error adding booking: {e}")
        return jsonify(message="Error adding booking"), 500
        
    return jsonify(message="Booking successfully created"), 200
    
def insert_booking(player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id, booking_time):
    sql = "INSERT INTO Bookings(player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id, hash) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)"

    try:
        hashed_value = hash_booking(contact_email, start_time, booking_time)
        execute_query(sql, (player_name, contact_name, contact_email, contact_phone_number, start_time, cost, rule_id, duration, coach_id, hashed_value))
        return hashed_value        
    except Exception as e:
        logging.error(f"Error inserting booking: {e}")
        return None
    
    
def check_for_overlap(start_time, duration, coach_id):
    end_time = start_time + duration*60
    
    sql = """
        SELECT EXISTS(
            SELECT 1 FROM Bookings
            WHERE coach_id=%s
            AND start_time<%s 
            AND (start_time+duration*60)>%s
            AND status!='cancelled'
        )
    """
    
    result = execute_query(sql, (coach_id, end_time, start_time))[0][0]
    
    if result:
        return True
    else:
        return False
    
    
def fetch_coach(slug):
    
    sql = "SELECT coach_id, username, show_email_publicly, show_phone_number_publicly FROM Coaches WHERE slug=%s"
    
    try:
        result = execute_query(sql, (slug,))[0]
        coach_id = result[0]
        coach_email = result[1]
        show_email_publicly = result[2]
        show_phone_number_publicly = result[3]
    except IndexError:
        return None, None, None, None
    
    return coach_id, coach_email, show_email_publicly, show_phone_number_publicly
    
    
def validate_inputs(start_time, duration, player_name, contact_name, is_same_as_player_name, contact_email, contact_phone_number, cost, rule_id):
    
    # if all inputs are valid then return True, None
    # otherwise return False, error message
    
    # check that none of the inputs are None
    if start_time is None:
        return False, "startTime is None"
    if duration is None:
        return False, "duration is None"
    if player_name is None:
        return False, "playerName is None"
    if contact_name is None and not is_same_as_player_name:
        return False, "contactName is None"
    if contact_email is None:
        return False, "email is None"
    if contact_phone_number is None:
        return False, "phoneNumber is None"
    if cost is None:
        return False, "cost is None"
    if rule_id is None:
        return False, "ruleId is None"
    
    # booking cannot be in the past
    if start_time < int(time.time()):
        return False, "Start time must be in the future"
    
    # duration must be a positive integer
    if type(duration) != int or duration <= 0:
        return False, "Duration must be a positive integer"
    
    if len(player_name) < 2:
        return False, "Player name must be a string longer than 1 character"
    
    # validate email format
    if not re.match(r"[^@]+@[^@]+\.[^@]+", contact_email):
        return False, "email is not valid"
    
    # validate phone number format
    if not re.match(r"^(\+44\d{10}|0\d{10})$", contact_phone_number):
        return False, "phoneNumber is not valid"
        
    # validate cost is a positive integer

    if type(cost) != int or cost <= 0:
        return False, "cost is not a positive integer"
    
    return True, None

def hash_booking(contact_email, start_time, booking_time):
    # Create a new sha256 hash object
    hash_object = hashlib.sha256()

    # Update the hash object with the bytes of the string
    hash_object.update(f"{contact_email}-{start_time}-{booking_time}".encode())

    # Get the hexadecimal representation of the digest
    hashed_value = hash_object.hexdigest()

    return hashed_value

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
    if coach_phone_number is not None:
        bodyHTML += f"<p>Coach contact phone number: {coach_phone_number}.</p>"
    
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


def send_confirmation_emails(contact_email, start_time, duration, cost, hash, player_name, show_email_publicly, show_phone_number_publicly, coach_id):
    
    attributes = get_user_attributes(coach_id)
    
    if not attributes:
        return
    
    coach_phone_number = attributes['phone_number']
    coach_email = attributes['email']
    
    # convert coach phone number from +44 to 07
    if coach_phone_number.startswith("+44"):
        coach_phone_number = coach_phone_number[3:]
        
    try:    
        send_coach_confirmation_email(coach_email, start_time, duration, player_name)
    except Exception as e:
        logging.error(f"Error sending coach confirmation email: {e}")
    
    try:
        send_player_confirmation_email(contact_email, start_time, duration, cost, hash, coach_email if show_email_publicly else None, coach_phone_number if show_phone_number_publicly else None)
    except Exception as e:
        logging.error(f"Error sending player confirmation email: {e}")
    