
from src.Database.ExecuteQuery import execute_query
    
def insert_player(player_name, contact_id, coach_id):
    sql = "INSERT INTO Players (name, contact_id, coach_id) VALUES (%s, %s, %s)"
    
    execute_query(sql, (player_name, contact_id, coach_id), is_get_query=False)
    
    