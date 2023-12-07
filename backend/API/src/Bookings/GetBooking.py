
from src.Database.ExecuteQuery import execute_query

def get_booking(booking_id):
        
    sql = """    
        SELECT Bookings.*, Players.name AS player_name, Contacts.name AS contact_name , Contacts.email AS contact_email, Contacts.phone_number AS contact_phone_number
        FROM Bookings 
        LEFT JOIN Players ON Bookings.player_id = Players.player_id 
        LEFT JOIN Contacts ON Bookings.contact_id = Contacts.contact_id 
        WHERE booking_id = %s
    """
    
    booking = execute_query(sql, (booking_id,), is_get_query=True)

    return booking[0]

def get_booking_by_hash(booking_hash):
        
    sql = """
    SELECT Bookings.*, Players.name AS player_name, Contacts.name AS contact_name , Contacts.email AS contact_email, Contacts.phone_number AS contact_phone_number
    FROM Bookings 
    LEFT JOIN Players ON Bookings.player_id = Players.player_id 
    LEFT JOIN Contacts ON Bookings.contact_id = Contacts.contact_id 
    WHERE hash = %s
    """    
    booking = execute_query(sql, (booking_hash,), is_get_query=True)

    return booking[0]