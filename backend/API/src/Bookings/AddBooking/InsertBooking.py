import hashlib
import json

from src.Bookings.GetBooking import get_booking_by_hash
from src.Database.ExecuteQuery import execute_query
from src.Logs.WriteLog import write_log
from src.Users.GetSelf.GetSelf import get_coach_from_id

def hash_booking(contact_id, start_time, booking_time):
    # Create a new sha256 hash object
    hash_object = hashlib.sha256()

    # Update the hash object with the bytes of the string
    hash_object.update(f"{contact_id}-{start_time}-{booking_time}".encode())

    # Get the hexadecimal representation of the digest
    hashed_value = hash_object.hexdigest()

    return hashed_value
  
def insert_booking(player_id, contact_id, start_time, cost, rules, duration, coach, booking_time, repeat_id=None, coach_id=None):
    
    hashed_value = hash_booking(contact_id, start_time, booking_time)
    
    if coach_id is not None:
        coach = get_coach_from_id(coach_id)
    
    write_log(f"Inserting booking with hash {hashed_value}")
    write_log(f"""Inserting booking with data: {json.dumps({
        
        'player_id': player_id,
        'contact_id': contact_id,
        'start_time': start_time,
        'cost': cost,
        'rules': rules,
        'duration': duration,
        'coach': coach,
        'booking_time': booking_time,
        'repeat_id': repeat_id
        
        }, indent=4)}""")
    
    coach_id = coach['coach_id']
    
    if repeat_id:
        sql = "INSERT INTO Bookings(player_id, contact_id, start_time, cost, duration, coach_id, hash, repeat_id) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"
        execute_query(sql, args=(player_id, contact_id, start_time, cost, duration, coach_id, hashed_value, repeat_id), is_get_query=False)
    else:
        sql = "INSERT INTO Bookings(player_id, contact_id, start_time, cost, duration, coach_id, hash) VALUES (%s, %s, %s, %s, %s, %s, %s)"
        execute_query(sql, args=(player_id, contact_id, start_time, cost, duration, coach_id, hashed_value), is_get_query=False)

    booking_id = get_booking_by_hash(hashed_value)['booking_id']
    
    insert_rules(booking_id, rules)

    return hashed_value        

def insert_rules(booking_id, rules):
    sql = "INSERT INTO BookingsPricingJoinTable(booking_id, rule_id) VALUES (%s, %s)"
    for rule in rules['extra']:

        execute_query(sql, args=(booking_id, rule['rule_id']), is_get_query=False)
        
    execute_query(sql, args=(booking_id, rules['hourly']['rule_id']), is_get_query=False)