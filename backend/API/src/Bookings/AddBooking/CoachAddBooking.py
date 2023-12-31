from flask import request, jsonify, Blueprint
import time
import json
import logging

logging.basicConfig(level=logging.DEBUG)

from src.Bookings.AddBooking.BookingEmails import send_confirmation_emails_booked_by_coach
from src.Bookings.AddBooking.CalculateLessonCost import calculate_lesson_cost
from src.Bookings.AddBooking.InsertBooking import insert_booking

from src.Contacts.Players.GetPlayer import get_player_from_id
from src.Contacts.GetContact import get_contact_by_id

from src.Repeats.CreateRepeatLesson import create_repeating_lesson

from src.Users.GetSelf.GetSelf import get_coach

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
    
    print(f"Coach add booking request received with data: {data}")
    
    try:
        
        # TODO need to check attributes are not null
    
        start_time = int(data['startTime'])
        duration = int(data['duration'])
        player_id = int(data['playerId'])
        
        repeats = data.get('repeats')
        if repeats:
            repeat_indefinitely = data.get('repeatIndefinitely', True) == 'true'
            repeats_frequency = data['repeatFrequency']
            if not repeat_indefinitely:                
                repeats_until = data.get('repeatUntil', None)
            else:
                repeats_until = None
        else:
            repeats_until = None
            repeats_frequency = None
        
        
    except KeyError as e:
        return jsonify(message=f"Missing key: {e}"), 400
    except TypeError as e:
        return jsonify(message=f"Invalid type: {e}"), 400

    player = get_player_from_id(player_id)
    player_id = player.get('player_id')
    
    if repeats_until is not None:
        repeats_until = int(repeats_until)
    
    contact = get_contact_by_id(player['contact_id'])
    
    if not repeats:
                
        lesson_cost, rules = calculate_lesson_cost(start_time, duration, coach['coach_id'])

        hash = insert_booking(player_id, player['contact_id'], start_time, lesson_cost, rules, duration, coach, int(time.time()))
        send_confirmation_emails_booked_by_coach(
            contact['email'],
            start_time,
            duration,
            lesson_cost,
            hash,
            player['name'],
            coach['coach_id']
        )
        
    else:
        create_repeating_lesson(
            player_id,
            player['contact_id'],
            start_time,
            duration,
            coach,
            int(time.time()),            
            repeats_frequency,
            repeat_until=repeats_until
        )
    
    return jsonify(message='Booking added successfully'), 200
    
