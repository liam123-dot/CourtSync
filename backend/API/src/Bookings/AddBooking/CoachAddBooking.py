from flask import request, jsonify, Blueprint
import time
import logging

logging.basicConfig(level=logging.DEBUG)

from src.Users.GetSelf.GetSelf import get_coach
from src.Contacts.Players.GetPlayer import get_player_from_id
from src.Contacts.GetContact import get_contact_by_id

from src.Bookings.AddBooking.InsertBooking import insert_booking
from src.Bookings.AddBooking.BookingEmails import send_confirmation_emails

CoachAddBookingBlueprint = Blueprint('CoachAddBookingBlueprint', __name__)

@CoachAddBookingBlueprint.route('/booking', methods=['POST'])
def coach_add_booking():
    
    token = request.headers.get('Authorization')

    if not token:
        return jsonify(message='Missing token'), 401
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify(message='Invalid token'), 401
    
    data = request.json
    
    try:
    
        start_time = int(data['startTime'])
        duration = int(data['duration'])
        price = data['price']
        player_id = data['playerId']
        rule_id = data['ruleId']
        
    except KeyError as e:
        return jsonify(message=f"Missing key: {e}"), 400
    

    player = get_player_from_id(player_id)
    player_id = player.get('player_id')
    
    contact = get_contact_by_id(player['contact_id'])

    hash = insert_booking(player_id, player['contact_id'], start_time, price, rule_id, duration, coach['coach_id'], int(time.time()))
    logging.debug(f"coach add booking, hash: {hash}")
    send_confirmation_emails(
        contact['email'],
        start_time,
        duration,
        price,
        hash,
        player['name'],
        coach['show_email_publicly'],
        coach['show_phone_number_publicly'],
        coach['coach_id']
    )
    
    return jsonify(message='Booking added successfully'), 200
    
