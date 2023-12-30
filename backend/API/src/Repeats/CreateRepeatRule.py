from datetime import datetime

import hashlib
import time

from src.Database.ExecuteQuery import execute_query

def create_repeat_rule(start_time, repeat_frequency, coach_id, repeat_until=None):
    # Generate the cron expression
    cron_expression = generate_cron_expression(start_time, repeat_frequency)
    
    hash = hash_repeat_rule(start_time, repeat_frequency, time.time())
    
    if repeat_until is not None:
        # Include cron_expression in the SQL query
        sql = "INSERT INTO RepeatRules(start_time, repeat_until, repeat_frequency, cron, hash, coach_id) VALUES (%s, %s, %s, %s, %s, %s)"
        
        execute_query(sql, args=(start_time, repeat_until, repeat_frequency, cron_expression, hash, coach_id), is_get_query=False)
    else:
        sql = "INSERT INTO RepeatRules(start_time, repeat_frequency, cron, hash, coach_id) VALUES (%s, %s, %s, %s, %s)"
        
        execute_query(sql, args=(start_time, repeat_frequency, cron_expression, hash, coach_id), is_get_query=False)
    
    return hash
    
def get_repeat_rule_by_hash(hash):
    sql = "SELECT * FROM RepeatRules WHERE hash = %s"
    
    return execute_query(sql, args=(hash,), is_get_query=True)[0]

def get_repeat_rule_by_id(rule_id):
    sql = "SELECT * FROM RepeatRules WHERE repeat_id = %s"
    
    return execute_query(sql, args=(rule_id,), is_get_query=True)[0]

def generate_cron_expression(start_time, repeat_frequency):
    # Convert start_time from epoch to a datetime object
    start_datetime = datetime.fromtimestamp(start_time)
    
    # Minute and hour from the start_time
    minute = start_datetime.minute
    hour = start_datetime.hour

    # Day of week for weekly, date for daily or fortnightly
    if repeat_frequency == 'daily':
        cron_day = '*'
    elif repeat_frequency == 'weekly':
        cron_day = f"{start_datetime.weekday()}"

    return f"{minute} {hour} * * {cron_day}"


def hash_repeat_rule(start_time, repeat_frequency, current_time):
    hash_input = f"{start_time}-{repeat_frequency}-{current_time}".encode()
    return hashlib.sha256(hash_input).hexdigest()