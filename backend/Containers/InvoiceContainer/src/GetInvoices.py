from flask import Blueprint, jsonify, request
import time

from src.shared.CheckAuthorization import get_access_token_username
from src.shared.ExecuteQuery import execute_query

invoices = Blueprint('invoices', __name__)

# ------------------------------ GET DAILY INVOICES ------------------------------
    
def fetch_daily_invoices(username, limit, offset):
    sql = f"""SELECT booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration
                FROM Bookings
                WHERE coach_id=%s
                AND invoice_sent=0
                AND start_time < %s
                ORDER BY start_time
                LIMIT %s OFFSET %s"""

    results = execute_query(sql, (username, time.time(), limit, offset))
    return results

def process_daily_invoices(results):
    invoices = []
    for invoice in results:
        booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration = invoice
        invoices.append({
            'booking_id': booking_id,
            'player_name': player_name,
            'start_time': start_time,
            'contact_name': contact_name,
            'cost': cost,
            'paid': paid,
            'extra_costs': extra_costs,
            'duration': duration
            })
    return invoices

def get_daily_invoices(username, limit, offset):
    results = fetch_daily_invoices(username, limit, offset)
    invoices = process_daily_invoices(results)
    return invoices

# ------------------------------ GET WEEKLY OR MONTHLY INVOICES ------------------------------

def fetch_invoices(username, limit, offset, view):
    if view == 'weekly':
        sql = """SELECT
                    contact_phone_number,
                    COUNT(booking_id) AS bookings_count,
                    SUM(cost) AS total_cost,
                    YEARWEEK(FROM_UNIXTIME(start_time)) AS year_week
                FROM Bookings
                WHERE start_time < NOW()
                AND coach_id=%s
                GROUP BY contact_phone_number, YEARWEEK(FROM_UNIXTIME(start_time))
                ORDER BY year_week, contact_phone_number
                LIMIT %s OFFSET %s;"""
    else:
        sql = """SELECT
                    contact_phone_number,
                    COUNT(booking_id) AS bookings_count,
                    SUM(cost) AS total_cost,
                    YEAR(FROM_UNIXTIME(start_time)) AS year,
                    MONTH(FROM_UNIXTIME(start_time)) AS month
                FROM Bookings
                WHERE start_time < UNIX_TIMESTAMP(NOW())
                AND coach_id=%s
                GROUP BY contact_phone_number, YEAR(FROM_UNIXTIME(start_time)), MONTH(FROM_UNIXTIME(start_time))
                ORDER BY year, month, contact_phone_number
                LIMIT %s OFFSET %s;"""

    results = execute_query(sql, (username, limit, offset))
    return results

def fetch_contact_names(phone_numbers):
    placeholders = ', '.join(['%s'] * len(phone_numbers))
    contact_name_sql = f"""
    SELECT contact_phone_number, contact_name
    FROM Bookings
    WHERE contact_phone_number IN ({placeholders})
    """
    contact_names_result = execute_query(contact_name_sql, phone_numbers)
    return contact_names_result

def process_invoices(results, contact_names_result, view):
    contact_info = {row[0]: row[1] for row in contact_names_result}
    invoices = []
    for invoice in results:
        contact_phone_number = invoice[0]
        contact_name = contact_info.get(contact_phone_number)
        bookings_count = invoice[1]
        total_cost = invoice[2]
        year = None
        month = None
        year_week = None
        if view == 'weekly':
            year_week = invoice[3]
        else:
            year = invoice[3]
            month = invoice[4]

        invoice_data = {
            'contact_phone_number': contact_phone_number,
            'contact_name': contact_name,
            'bookings_count': bookings_count,
            'total_cost': total_cost
        }
        
        if view == 'weekly':
            invoice_data['year_week'] = year_week
        else:
            invoice_data['year'] = year
            invoice_data['month'] = month

        invoices.append(invoice_data)
        
    return invoices

def get_weekly_or_monthly_invoices(username, limit, offset, view):
    results = fetch_invoices(username, limit, offset, view)
    phone_numbers = [result[0] for result in results]
    contact_names_result = fetch_contact_names(phone_numbers)
    invoices = process_invoices(results, contact_names_result, view)
    return invoices

# ------------------------------ GET INVOICES ENDPOINT ------------------------------

@invoices.route('/invoices', methods=['GET'])
def get_invoices():
    view, limit, offset, error, status = get_query_parameters()
    if error:
        return error, status

    valid, username = get_access_token_username()
    if not valid:
        return jsonify(message="Unauthorized"), 401

    if view == 'daily':
        invoices = get_daily_invoices(username, limit, offset)
    elif view in ['weekly', 'monthly']:
        invoices = get_weekly_or_monthly_invoices(username, limit, offset, view)
    else:
        return jsonify(message="Invalid view"), 400

    return jsonify(data=invoices), 200


def get_query_parameters():
    try:
        view = request.args.get('view', 'daily')  # Set a default view if not provided
        limit = int(request.args.get('limit', 10))  # Set a default limit if not provided
        offset = int(request.args.get('offset', 0))  # Set a default offset if not provided
    except ValueError as e:  # Catching ValueError for int conversion
        return None, None, None, e, jsonify(message=f"Invalid query string parameter: {e}"), 400
    return view, limit, offset, None, None