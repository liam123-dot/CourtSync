import logging

logging.basicConfig(level=logging.DEBUG)

from datetime import datetime, timedelta

from src.Bookings.AddBooking.BookingEmails import send_player_repeat_lesson
from src.Bookings.AddBooking.CalculateLessonCost import calculate_lesson_cost
from src.Bookings.AddBooking.InsertBooking import insert_booking

from src.Repeats.CreateRepeatRule import create_repeat_rule, get_repeat_rule_by_hash

def create_repeating_lesson(
        player_id,
        contact_id,
        start_time,
        duration,
        coach,
        booking_time,
        repeat_frequency,
        repeat_until=None
    ):
    
    coach_id = coach['coach_id']
    
    lesson_cost, rules = calculate_lesson_cost(start_time, duration, coach_id)
    
    repeat_hash = create_repeat_rule(start_time, repeat_frequency, repeat_until=repeat_until, coach_id=coach_id)
    repeat_rule = get_repeat_rule_by_hash(repeat_hash)
    
    insert_booking(
        player_id,
        contact_id,
        start_time,
        lesson_cost,
        rules,
        duration,
        coach,
        booking_time,
        repeat_id=repeat_rule['repeat_id']
    )
    
    # send_player_repeat_lesson(start_time, duration, player_id)
    
    logging.debug('repeat_rule made')
        
