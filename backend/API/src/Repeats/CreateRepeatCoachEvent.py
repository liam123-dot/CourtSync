from datetime import datetime, timedelta

from src.Repeats.CreateRepeatRule import create_repeat_rule, get_repeat_rule_by_hash
from src.Database.ExecuteQuery import execute_query
from src.Timetable.CheckOverlaps import check_overlaps_repeats

def create_repeating_coach_event(
        args,
        start_time,
        end_time,
        repeat_until,
        repeat_frequency  
    ):
    
    start_date = datetime.fromtimestamp(start_time)
    end_date = datetime.fromtimestamp(end_time)
    
    repeat_hash = create_repeat_rule(repeat_until, repeat_frequency)
    repeat_rule = get_repeat_rule_by_hash(repeat_hash)
    
    args += (repeat_rule['repeat_id'], )
    
    while start_date.timestamp() <= repeat_until:
        
        sql = """INSERT INTO CoachEvents (coach_id, start_time, duration, title, description, status, repeat_id) 
        VALUES (%s, %s, %s, %s, %s, 'confirmed', %s)"""
                
        execute_query(sql, args=args, is_get_query=False)
        
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
        
        args[1] = start_date.timestamp()
