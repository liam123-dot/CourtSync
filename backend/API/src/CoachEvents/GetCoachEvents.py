from src.Database.ExecuteQuery import execute_query

def get_coach_events(coach_id, from_time=None, to_time=None, include_cancelled=True):
    sql = """
    SELECT ce.*, rr.repeat_frequency as repeat_frequency, rr.repeat_until as repeat_until
    FROM CoachEvents ce
    LEFT JOIN RepeatRules rr ON ce.repeat_id = rr.repeat_id
    WHERE ce.coach_id = %s
    """
    
    args = (coach_id,)
    
    if from_time and to_time:
        sql += " AND ce.start_time >= %s AND ce.start_time <= %s"
        args += (from_time, to_time)
        
    if not include_cancelled:
        sql += " AND ce.status != 'cancelled'"
    
    results = execute_query(sql, args=args, is_get_query=True)
    
    return results

def get_coach_event(coach_event_id):
    sql = """
    SELECT ce.*, rr.repeat_frequency as repeat_frequency, rr.repeat_until as repeat_until
    FROM CoachEvents ce
    LEFT JOIN RepeatRules rr ON ce.repeat_id = rr.repeat_id
    WHERE ce.event_id = %s
    """
    
    args = (coach_event_id,)
    
    results = execute_query(sql, args=args, is_get_query=True)
    
    return results[0]