
from src.Database.ExecuteQuery import execute_query

def get_players(contact_id, coach_id):
    sql = "SELECT * FROM Players WHERE contact_id=%s AND coach_id=%s and enabled=1"
    results = execute_query(sql, (contact_id, coach_id), is_get_query=True)
    
    if results is None or len(results) == 0:
        return None
    
    return results

def get_player(player_name, contact_id, coach_id):
    sql = "SELECT * FROM Players WHERE name=%s AND contact_id=%s AND coach_id=%s"
    results = execute_query(sql, (player_name, contact_id, coach_id), is_get_query=True)
    
    if results is None or len(results) == 0:
        return None
    
    return results[0]

def get_player_from_id(player_id):
    sql = "SELECT * FROM Players WHERE player_id=%s"
    results = execute_query(sql, (player_id,), is_get_query=True)
    
    if results is None or len(results) == 0:
        return None
    
    return results[0]