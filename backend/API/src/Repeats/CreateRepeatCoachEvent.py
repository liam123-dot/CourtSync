from datetime import datetime, timedelta
import time

from src.Bookings.AddBooking.InsertBooking import hash_booking
from src.Database.ExecuteQuery import execute_query
from src.Repeats.CreateRepeatRule import create_repeat_rule, get_repeat_rule_by_hash
from src.Timetable.CheckOverlaps import check_overlaps_repeats

def create_repeating_coach_event(
        args,
        start_time,
        end_time,
        repeat_until,
        repeat_frequency  ,
        coach
    ):
    
    coach_id = coach['coach_id']
    
    start_date = datetime.fromtimestamp(start_time)
    end_date = datetime.fromtimestamp(end_time)
    
    repeat_hash = create_repeat_rule(start_time, repeat_frequency, repeat_until=repeat_until, coach_id=coach_id)
    repeat_rule = get_repeat_rule_by_hash(repeat_hash)
    
    insert_coach_event(*args, repeat_id=repeat_rule['repeat_id'])
    
def insert_coach_event(coach, start_time, end_time, title, description, repeat_id):
    
    hash = hash_booking(start_time, end_time, time.time())
    
    sql = "INSERT INTO CoachEvents (coach_id, start_time, duration, title, description, status, repeat_id, hash) VALUES (%s, %s, %s, %s, %s, 'confirmed', %s, %s)"
    
    params = (coach['coach_id'], start_time, (end_time - start_time)/60, title, description, repeat_id, hash)
    
    execute_query(sql, params, is_get_query=False)
    
    return hash
    