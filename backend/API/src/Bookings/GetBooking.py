
from src.Database.ExecuteQuery import execute_query

def get_booking(booking_id):
        
    sql = "SELECT * FROM Bookings WHERE booking_id = %s"
    
    booking = execute_query(sql, (booking_id,), is_get_query=True)

    return booking[0]
