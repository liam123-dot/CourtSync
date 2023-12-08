import hashlib
import time

from src.Database.ExecuteQuery import execute_query

def create_repeat_rule(
    repeat_until,
    repeat_frequency
):
    hash = hash_repeat_rule(repeat_until, repeat_frequency)
    
    sql = "INSERT INTO RepeatRules(repeat_until, repeat_frequency, hash) VALUES (%s, %s, %s)"
    
    execute_query(sql, args=(repeat_until, repeat_frequency, hash), is_get_query=False)
    
    return hash
    
def get_repeat_rule_by_hash(hash):
    sql = "SELECT * FROM RepeatRules WHERE hash = %s"
    
    return execute_query(sql, args=(hash,), is_get_query=True)[0]

def get_repeat_rule_by_id(rule_id):
    sql = "SELECT * FROM RepeatRules WHERE repeat_id = %s"
    
    return execute_query(sql, args=(rule_id,), is_get_query=True)[0]

def hash_repeat_rule(repeat_until, repeat_frequency):
    # Create a new sha256 hash object
    hash_object = hashlib.sha256()

    # Update the hash object with the bytes of the string
    hash_object.update(f"{repeat_until}-{repeat_frequency}-{time.time()}".encode())

    # Get the hexadecimal representation of the digest
    hashed_value = hash_object.hexdigest()

    return hashed_value