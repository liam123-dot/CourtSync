
from src.Database.ExecuteQuery import execute_query

def get_invoice(invoice_id):
    
    sql = "SELECT * FROM Bookings WHERE invoice_id = %s"
    
    result = execute_query(sql, [invoice_id], True)
    
    if not result:
        return None
    
    if len(result) == 0:
        return None
    
    if len(result) >= 1:
        return result[0]


