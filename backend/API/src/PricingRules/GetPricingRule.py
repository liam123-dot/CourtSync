from src.Database.ExecuteQuery import execute_query

def get_pricing_rule_from_id(pricing_rule_id):
    
    sql = "SELECT * FROM PricingRules WHERE rule_id = %s"
    
    values = (pricing_rule_id,)
    
    results = execute_query(sql, values, True)    

    if len (results) == 0:
        return None
    
    return results[0]
    
