from flask import current_app

from src.Database.DatabaseConnection import DatabaseConnection
from src.Logs.WriteLog import write_log

def execute_query(sql, args=None, is_get_query=True, retry=False):
    
    write_log(f"Executing query: {sql}, {args}")
    try:
        with current_app.app_context():
            db = current_app.config['db_connection'].connection
            
            with db.cursor() as cursor:
                cursor.execute(sql, args)
                
                if is_get_query:
                    column_names = [desc[0] for desc in cursor.description]
                    rows = cursor.fetchall()
                    
                    results = []
                    
                    for row in rows:
                        if row is not None:
                            row_dict = dict(zip(column_names, row))
                            for key, value in row_dict.items():
                                if isinstance(value, bytes):
                                    row_dict[key] = bool(int.from_bytes(value, byteorder='big'))
                            results.append(row_dict)                        
                else:
                    db.commit()
                    results = None        
            write_log(f"Results: {results}")
            return results
    except Exception as e:
        write_log("Error executing query")
        write_log(f"Error: {e}")
        db_connection = DatabaseConnection()
        current_app.config['db_connection'] = db_connection
        if not retry:
            return execute_query(sql, args, is_get_query, retry=True)