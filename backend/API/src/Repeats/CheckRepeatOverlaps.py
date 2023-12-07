from datetime import datetime, timedelta

from src.Timetable.CheckOverlaps import check_overlaps

def check_repeat_overlaps(coach_id, start_time, end_time, repeat_until, repeat_frequency):
    
    # create a datetime for the start and end time so that we can add the repeat frequency to it
    
    start_date = datetime.fromtimestamp(start_time)
    end_date = datetime.fromtimestamp(end_time)
    
    while start_date.timestamp() < repeat_until:
        
        overlaps, bookings, events = check_overlaps(coach_id, start_date.timestamp(), end_date.timestamp())
        
        if overlaps:
            return True
        
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

    return False