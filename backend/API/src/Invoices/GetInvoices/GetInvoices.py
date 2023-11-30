
from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import dateutil.relativedelta
import time

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

GetInvoicesBlueprint = Blueprint('invoices', __name__)

def fetch_contact_names(phone_numbers):
    if len(phone_numbers) == 0:
        return []
    placeholders = ', '.join(['%s'] * len(phone_numbers))
    contact_name_sql = f"""
    SELECT contact_email, contact_name
    FROM Bookings
    WHERE contact_email IN ({placeholders})
    """
    contact_names_result = execute_query(contact_name_sql, phone_numbers)
    return contact_names_result

def get_weekly_or_monthly_invoices(username, request_data):
    if request_data['view'] == 'monthly':
        time_group = "YEAR(FROM_UNIXTIME(start_time)) AS year, MONTH(FROM_UNIXTIME(start_time)) AS month"
        group_by = "year, month"
    else:
        time_group = "YEARWEEK(FROM_UNIXTIME(start_time)) AS time_group"
        group_by = "time_group"

    if request_data['status_view'] == 'upcoming':
        paid_status = 'AND paid=0 AND invoice_sent=0 AND status=\'confirmed\''
    else:
        paid_status = f'AND paid={0 if request_data["status_view"]=="pending" else 1} AND invoice_sent=1'
        
        
    if request_data['contact_email']:
        sql = f"""SELECT
                    Contacts.email as contact_email,
                    Contacts.name as contact_name,
                    COUNT(Bookings.booking_id) AS bookings_count,
                    SUM(Bookings.cost + Bookings.extra_costs) AS total_cost,
                    {time_group}
                FROM Bookings
                INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
                WHERE Bookings.start_time < UNIX_TIMESTAMP()
                AND Bookings.coach_id=%s
                {paid_status}
                GROUP BY contact_email, {group_by}, contact_name
                ORDER BY {group_by}, contact_email
                LIMIT %s OFFSET %s;"""
        results = execute_query(sql, (username, request_data['contact_email'], request_data['limit'], request_data['offset']))
    else:
        sql = f"""SELECT
                    Contacts.email as contact_email,
                    Contacts.name as contact_name,
                    COUNT(Bookings.booking_id) AS bookings_count,
                    SUM(Bookings.cost + Bookings.extra_costs) AS total_cost,
                    {time_group}
                FROM Bookings
                INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
                WHERE Bookings.start_time < UNIX_TIMESTAMP()
                AND Bookings.coach_id=%s
                {paid_status}
                GROUP BY contact_email, {group_by}, contact_name
                ORDER BY {group_by}, contact_email
                LIMIT %s OFFSET %s;"""
        results = execute_query(sql, (username, request_data['limit'], request_data['offset']))


    if len(results) == 0:
        return []

    invoices = []
    for row in results:
        invoices.append(row)
    return invoices


def get_daily_invoices(username, request_data):
    if request_data['status_view'] == 'upcoming':
        paid_status = 'AND paid=0 AND invoice_sent=0 AND status=\'confirmed\''
    else:
        paid_status = f'AND paid={0 if request_data["status_view"]=="pending" else 1} AND invoice_sent=1'

    if request_data['contact_email']:
        sql = f"""SELECT Bookings.booking_id, Players.name as player_name, Bookings.start_time, Contacts.name as contact_name, Bookings.cost, Bookings.paid, Bookings.extra_costs, Bookings.duration, Contacts.email as contact_email
                    FROM Bookings
                    INNER JOIN Players ON Bookings.player_id = Players.player_id
                    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
                    WHERE Bookings.coach_id=%s
                    AND Bookings.start_time < %s
                    {paid_status}
                    AND Contacts.email=%s
                    AND Bookings.status='confirmed'
                    ORDER BY Bookings.start_time
                    LIMIT %s OFFSET %s"""
        results = execute_query(sql, (username, time.time(), request_data['contact_email'], request_data['limit'], request_data['offset']), is_get_query=True)
    else:
        sql = f"""SELECT Bookings.booking_id, Players.name as player_name, Bookings.start_time, Contacts.name as contact_name, Bookings.cost, Bookings.paid, Bookings.extra_costs, Bookings.duration, Contacts.email as contact_email
                    FROM Bookings
                    INNER JOIN Players ON Bookings.player_id = Players.player_id
                    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
                    WHERE Bookings.coach_id=%s
                    AND Bookings.start_time < %s
                    {paid_status}
                    AND Bookings.status='confirmed'
                    ORDER BY Bookings.start_time
                    LIMIT %s OFFSET %s"""
        results = execute_query(sql, (username, time.time(), request_data['limit'], request_data['offset']), is_get_query=True)
         
    return results


def get_invoices(username, request_data):
    
    if request_data['view'] == 'daily':
        invoices = get_daily_invoices(username, request_data)
    else:
        invoices = get_weekly_or_monthly_invoices(username, request_data)
        
    return invoices
        
# ------------------------------ CHECK COACH INVOICES INTIALISED ------------------------------

def get_coach_invoice_preferences(coach_id):
    sql = "SELECT stripe_account, invoice_type FROM Coaches WHERE coach_id=%s"
    results = execute_query(sql, (coach_id,), is_get_query=True)
    result = results[0]
    
    return result['stripe_account'], result
    

# ------------------------------ GET INVOICES ENDPOINT ------------------------------

@GetInvoicesBlueprint.route('/invoices', methods=['GET'])
def get_invoices_endpoint():
    request_data, error, status = get_query_parameters()
    if error:
        return error, status
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify(message="Unauthorized"), 401

    coach = get_coach(token)
    if not coach:
        return jsonify(message="Unauthorized"), 401
    
    coach_id = coach['coach_id']
    
    stripe_account, invoice_data = get_coach_invoice_preferences(coach_id)
    
    invoices_initailised = stripe_account is not None and invoice_data['invoice_type'] is not None
    
    request_data['view'] = invoice_data['invoice_type']
    
    if not invoices_initailised:
        return jsonify(invoices_initialised=False), 200
    
    if request_data['view'] in ['daily', 'weekly', 'monthly']:
    
        invoices = get_invoices(coach_id, request_data)
    else:
        return jsonify(message="Invalid view"), 400
    
    return jsonify(data=invoices, invoices_initialised=True, invoice_type=invoice_data['invoice_type']), 200

def get_query_parameters():
    try:    
        status_view = request.args.get('statusView', 'pending')
        contact_email = request.args.get('contactEmail', None)
        limit = int(request.args.get('limit', 10))  # Set a default limit if not provided
        offset = int(request.args.get('offset', 0))  # Set a default offset if not provided
    except ValueError as e:  # Catching ValueError for int conversion
        return None, e, jsonify(message=f"Invalid query string parameter: {e}"), 400
    return {
        'status_view': status_view,
        'contact_email': contact_email,
        'limit': limit,
        'offset': offset
    }, None, None
    
@GetInvoicesBlueprint.route('/invoices/daily', methods=['GET'])
def get_invoices_daily_endpoint():
    
    token = request.headers.get('Authorization')
    if not token:
        return jsonify(message="Unauthorized"), 401

    coach = get_coach(token)
    if not coach:
        return jsonify(message="Unauthorized"), 401
    
    coach_id = coach['coach_id']
        
    week = request.args.get('week', None)
    month =request.args.get('month', None)
    year = request.args.get('year', None)
    
    if week:
        week = int(week)
    if month:
        month = int(month)
    if year:
        year = int(year)
    
    contact_email = request.args.get('contactEmail', None)
    
    status_view = request.args.get('statusView', 'pending')
    
    # year and phone number are required
    # only need one of month and week
    
    if not year:
        return jsonify(message="Missing year"), 400
    if not contact_email:
        return jsonify(message="Missing email"), 400
    if not (week or month):
        return jsonify(message="Missing week or month"), 400
    
    request_data = {}
    
    if week:
        request_data['week'] = week
    if month:
        request_data['month'] = month
        
    request_data['year'] = year
    request_data['contact_email'] = contact_email
    request_data['status_view'] = status_view
    
    invoices = get_daily_invoices_specific(coach_id, request_data)
    
    return jsonify(data=invoices), 200
        

def get_daily_invoices_specific(username, request_data):
    if 'week' in request_data:
        start_time = datetime.strptime(f"{request_data['year']}-{request_data['week']}-1", "%Y-%W-%w")
        end_time = start_time + timedelta(days=7)
    elif 'month' in request_data:
        start_time = datetime(request_data['year'], request_data['month'], 1)
        end_time = (start_time + dateutil.relativedelta.relativedelta(months=1)) if request_data['month'] != 12 else datetime(request_data['year']+1, 1, 1)
    else:
        return []

    start_timestamp = start_time.timestamp()
    end_timestamp = end_time.timestamp()

    if request_data['status_view'] == 'upcoming':
        paid_status = 'AND paid=0 AND invoice_sent=0 AND status=\'confirmed\' AND start_time <= UNIX_TIMESTAMP()'
    else:
        paid_status = f'AND paid={0 if request_data["status_view"]=="pending" else 1} AND invoice_sent=1'

    if request_data['contact_email']:
        sql = f"""SELECT Bookings.booking_id, Players.name as player_name, Bookings.start_time, Contacts.name as contact_name, Bookings.cost, Bookings.paid, Bookings.extra_costs, Bookings.duration, Contacts.email as contact_email
                    FROM Bookings
                    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
                    INNER JOIN Players ON Bookings.player_id = Players.player_id
                    WHERE Bookings.coach_id=%s
                    AND Bookings.start_time >= %s
                    AND Bookings.start_time < %s
                    {paid_status}
                    AND Contacts.email=%s
                    AND Bookings.status='confirmed'
                    ORDER BY Bookings.start_time
                    """
        results = execute_query(sql, (username, start_timestamp, end_timestamp, request_data['contact_email']), is_get_query=True)
    else:
        sql = f"""SELECT Bookings.booking_id, Players.name as player_name, Bookings.start_time, Contacts.name as contact_name, Bookings.cost, Bookings.paid, Bookings.extra_costs, Bookings.duration, Contacts.email as contact_email
                    FROM Bookings
                    INNER JOIN Players ON Bookings.player_id = Players.player_id
                    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
                    WHERE Bookings.coach_id=%s
                    AND Bookings.start_time >= %s
                    AND Bookings.start_time < %s
                    {paid_status}
                    AND Bookings.status='confirmed'
                    ORDER BY Bookings.start_time
                    """
        results = execute_query(sql, (username, start_timestamp, end_timestamp), is_get_query=True)
         
    return results