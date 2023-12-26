import logging

logging.basicConfig(level=logging.DEBUG)

from datetime import datetime, timedelta

from src.Bookings.AddBooking.InsertBooking import insert_booking
from src.Bookings.AddBooking.CalculateLessonCost import calculate_lesson_cost

from src.Repeats.CreateRepeatRule import create_repeat_rule, get_repeat_rule_by_hash

def create_repeating_lesson(
        player_id,
        contact_id,
        start_time,
        duration,
        coach,
        booking_time,
        repeat_until,
        repeat_frequency
    ):
    
    coach_id = coach['coach_id']
    
    end_time = start_time + duration*60
    
    start_date = datetime.fromtimestamp(start_time)
    end_date = datetime.fromtimestamp(end_time)
    
    repeat_hash = create_repeat_rule(repeat_until, repeat_frequency)
    repeat_rule = get_repeat_rule_by_hash(repeat_hash)
        
    logging.debug('repeat_rule made')
        
    while start_date.timestamp() <= repeat_until:
        
        logging.debug('making first')
        
        lesson_cost, rules = calculate_lesson_cost(start_time, duration, coach_id)
        
        logging.debug(f"lesson_cost: {lesson_cost}")
        logging.debug(f"rules: {rules}")
        
        insert_booking(
            player_id,
            contact_id,
            start_date.timestamp(),
            lesson_cost,
            rules,
            duration,
            coach,
            booking_time,
            repeat_rule['repeat_id']
        )
        
        if repeat_frequency == 'daily':
            start_date = start_date + timedelta(days=1)
            end_date = end_date + timedelta(days=1)
        elif repeat_frequency == 'weekly':
            start_date = start_date + timedelta(weeks=1)
            end_date = end_date + timedelta(weeks=1)
        elif repeat_frequency == 'fortnightly':
            start_date = start_date + timedelta(weeks=2)
            end_date = end_date + timedelta(weeks=2)
        elif repeat_frequency == 'monthly':
            start_date = start_date + timedelta(weeks=4)
            end_date = end_date + timedelta(weeks=4)
        