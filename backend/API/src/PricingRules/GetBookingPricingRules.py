from src.Database.ExecuteQuery import execute_query

def get_booking_pricing_rules(booking_id):
    
    sql = """
    SELECT Rules.*, BookingsPricingJoinTable.booking_id
    FROM Rules
    INNER JOIN BookingsPricingJoinTable ON Rules.rule_id = BookingsPricingJoinTable.rule_id
    WHERE BookingsPricingJoinTable.booking_id = %s
    """
    
    return execute_query(sql, args=(booking_id,), is_get_query=True)

