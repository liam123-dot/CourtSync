
from src.Database.ExecuteQuery import execute_query

def get_coaches(invoice_type=None):
    sql = "SELECT * FROM Coaches WHERE 1"
    
    args = ()
    
    if invoice_type:
        sql += " AND invoice_type=%s"
        args += (invoice_type,)
    
    results = execute_query(sql, is_get_query=True)
    
    if results is None or len(results) == 0:
        return None
    
    return results