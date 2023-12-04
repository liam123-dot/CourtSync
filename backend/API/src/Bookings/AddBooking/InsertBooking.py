import hashlib

from src.Database.ExecuteQuery import execute_query

def hash_booking(contact_id, start_time, booking_time):
    # Create a new sha256 hash object
    hash_object = hashlib.sha256()

    # Update the hash object with the bytes of the string
    hash_object.update(f"{contact_id}-{start_time}-{booking_time}".encode())

    # Get the hexadecimal representation of the digest
    hashed_value = hash_object.hexdigest()

    return hashed_value

    
def insert_booking(player_id, contact_id, start_time, cost, rule_id, duration, coach_id, booking_time):
    sql = "INSERT INTO Bookings(player_id, contact_id, start_time, cost, rule_id, duration, coach_id, hash) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"

    hashed_value = hash_booking(contact_id, start_time, booking_time)

    execute_query(sql, args=(player_id, contact_id, start_time, cost, rule_id, duration, coach_id, hashed_value), is_get_query=False)

    return hashed_value        
