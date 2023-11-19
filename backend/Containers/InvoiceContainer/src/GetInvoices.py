from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import dateutil.relativedelta
import time

from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query

invoices = Blueprint('invoices', __name__)

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
        time_group = "YEAR(FROM_UNIXTIME(start_time)), MONTH(FROM_UNIXTIME(start_time))"
    else:
        time_group = "YEARWEEK(FROM_UNIXTIME(start_time))"

    if request_data['contact_email']:
        sql = f"""SELECT
                    contact_email,
                    COUNT(booking_id) AS bookings_count,
                    SUM(cost + extra_costs) AS total_cost,
                    {time_group} AS time_group
                FROM Bookings
                WHERE start_time < NOW()
                AND coach_id=%s
                AND paid=%s
                AND contact_email=%s
                AND status='confirmed'
                AND invoice_sent=1
                GROUP BY contact_email, {time_group}
                ORDER BY time_group, contact_email
                LIMIT %s OFFSET %s;"""
        results = execute_query(sql, (username, 0 if request_data['status_view']=='pending' else 1, request_data['contact_email'], request_data['limit'], request_data['offset']))
    else:
        sql = f"""SELECT
                    contact_email,
                    COUNT(booking_id) AS bookings_count,
                    SUM(cost + extra_costs) AS total_cost,
                    {time_group} AS time_group
                FROM Bookings
                WHERE start_time < NOW()
                AND coach_id=%s
                AND paid=%s
                AND status='confirmed'
                AND invoice_sent=1
                GROUP BY contact_email, {time_group}
                ORDER BY time_group, contact_email
                LIMIT %s OFFSET %s;"""
        results = execute_query(sql, (username, 0 if request_data['status_view']=='pending' else 1, request_data['limit'], request_data['offset']))

    if len(results) == 0:
        return []
    phone_numbers = [result[0] for result in results]
    contact_names_result = fetch_contact_names(phone_numbers)
    contact_info = {row[0]: row[1] for row in contact_names_result}
    invoices = []
    if request_data['view'] == 'weekly':
        for row in results:
            invoices.append({
                'contact_email': row[0],
                'bookings_count': row[1],
                'total_cost': row[2],
                'year_week': row[3],
                'contact_name': contact_info.get(row[0], None)
            })
    else:
        for row in results:
            invoices.append({
                    'contact_email': row[0],
                    'bookings_count': row[1],
                    'total_cost': row[2],
                    'year': row[3],
                    'month': row[4],
                    'contact_name': contact_info.get(row[0], None)
                })
    return invoices


def get_daily_invoices(username, request_data):
    if request_data['contact_email']:
        sql = f"""SELECT booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration, contact_email
                    FROM Bookings
                    WHERE coach_id=%s
                    AND invoice_sent=1
                    AND start_time < %s
                    AND paid=%s 
                    AND contact_email=%s
                    AND status='confirmed'
                    ORDER BY start_time
                    LIMIT %s OFFSET %s"""
        results = execute_query(sql, (username, time.time(), 0 if request_data['status_view']=='pending' else 1, request_data['contact_email'], request_data['limit'], request_data['offset']))
    else:
        sql = f"""SELECT booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration, contact_email
                    FROM Bookings
                    WHERE coach_id=%s
                    AND invoice_sent=1
                    AND start_time < %s
                    AND paid=%s 
                    AND status='confirmed'
                    ORDER BY start_time
                    LIMIT %s OFFSET %s"""
        results = execute_query(sql, (username, time.time(), 0 if request_data['status_view']=='pending' else 1, request_data['limit'], request_data['offset']))
        
    bookings = []
    for row in results:
        bookings.append({
            'booking_id': row[0],
            'player_name': row[1],
            'start_time': row[2],
            'contact_name': row[3],
            'cost': row[4],
            'paid': row[5],
            'extra_costs': row[6],
            'duration': row[7],
            'contact_email': row[8]
        })        
    return bookings


def get_invoices(username, request_data):
    
    if request_data['view'] == 'daily':
        invoices = get_daily_invoices(username, request_data)
    else:
        invoices = get_weekly_or_monthly_invoices(username, request_data)
        
    return invoices
        
# ------------------------------ CHECK COACH INVOICES INTIALISED ------------------------------

def get_coach_invoice_preferences(coach_id):
    sql = "SELECT invoices_initialised, invoice_type FROM Coaches WHERE coach_id=%s"
    results = execute_query(sql, (coach_id,))
    result = results[0]
    invoices_initialised = result[0]
    
    return invoices_initialised, {
        'invoice_type': result[1],
    }

# ------------------------------ GET INVOICES ENDPOINT ------------------------------

@invoices.route('/invoices', methods=['GET'])
def get_invoices_endpoint():
    request_data, error, status = get_query_parameters()
    if error:
        return error, status
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify(message="Unauthorized"), 401

    valid, username = get_access_token_username(token)
    if not valid:
        return jsonify(message="Unauthorized"), 401
    
    invoices_initialised, invoice_data = get_coach_invoice_preferences(username)
    
    request_data['view'] = invoice_data['invoice_type']
    
    if not invoices_initialised:
        return jsonify(invoices_initialised=False), 200
    
    if request_data['view'] in ['daily', 'weekly', 'monthly']:
    
        invoices = get_invoices(username, request_data)
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
    
@invoices.route('/invoices/daily', methods=['GET'])
def get_invoices_daily_endpoint():
    
    token = request.headers.get('Authorization')
    if not token:
        return jsonify(message="Unauthorized"), 401

    valid, username = get_access_token_username(token)
    if not valid:
        return jsonify(message="Unauthorized"), 401
        
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
    
    invoices = get_daily_invoices_specific(username, request_data)
    
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

    if request_data['contact_email']:
        sql = f"""SELECT booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration, contact_email
                    FROM Bookings
                    WHERE coach_id=%s
                    AND invoice_sent=1
                    AND start_time >= %s
                    AND start_time < %s
                    AND paid=%s 
                    AND contact_email=%s
                    AND status='confirmed'
                    ORDER BY start_time
                    """
        results = execute_query(sql, (username, start_timestamp, end_timestamp, 0 if request_data['status_view']=='pending' else 1, request_data['contact_email']))
    else:
        sql = f"""SELECT booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration, contact_email
                    FROM Bookings
                    WHERE coach_id=%s
                    AND invoice_sent=1
                    AND start_time >= %s
                    AND start_time < %s
                    AND paid=%s 
                    AND status='confirmed'
                    ORDER BY start_time
                    """
        results = execute_query(sql, (username, start_timestamp, end_timestamp, 0 if request_data['status_view']=='pending' else 1))
        
    bookings = []
    for row in results:
        bookings.append({
            'booking_id': row[0],
            'player_name': row[1],
            'start_time': row[2],
            'contact_name': row[3],
            'cost': row[4],
            'paid': row[5],
            'extra_costs': row[6],
            'duration': row[7],
            'contact_email': row[8]
        })        
    return bookings