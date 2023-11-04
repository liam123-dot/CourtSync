from flask import Blueprint, request, jsonify
import logging
import time

from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query

logging.basicConfig(level=logging.DEBUG)

invoices = Blueprint('invoices', __name__)

@invoices.route('/timetable/invoices', methods=['GET'])
def get_invoices():
    try:
        view = request.args.get('view', 'daily')  # Set a default view if not provided
        time_scope = request.args.get('timeScope', 'all')  # Set a default time scope if not provided
        limit = int(request.args.get('limit', 10))  # Set a default limit if not provided
        offset = int(request.args.get('offset', 0))  # Set a default offset if not provided
    except ValueError as e:  # Catching ValueError for int conversion
        return jsonify(message=f"Invalid query string parameter: {e}"), 400

    token = request.headers.get('Authorization', None)
    if not token:
        return jsonify(message='No access token provided'), 400
    
    valid, username = get_access_token_username(token)
    if not valid:
        return jsonify(message='Invalid token'), 401
    
    # Assuming 'start_time' is a datetime field in your Bookings table
    now = int(time.time())
    invoices = []
    if view == 'daily':
        
        sql = f"""SELECT booking_id, player_name, start_time, contact_name, cost, paid, extra_costs, duration
                  FROM Bookings
                  WHERE coach_id=%s
                  AND invoice_sent=0
                  AND start_time < %s
                  ORDER BY start_time
                  LIMIT %s OFFSET %s"""

        results = execute_query(sql, (username, now, limit, offset))

        for invoice in results:
            booking_id = invoice[0]
            player_name = invoice[1]
            start_time = invoice[2]
            contact_name = invoice[3]
            cost = invoice[4]
            paid = invoice[5]
            extra_costs = invoice[6]
            duration = invoice[7]

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
    elif view == 'weekly':
        sql = """
        SELECT
            player_name,
            contact_phone_number,
            COUNT(booking_id) AS bookings_count,
            SUM(cost) AS total_cost,
            YEARWEEK(FROM_UNIXTIME(start_time)) AS year_week
        FROM Bookings
        WHERE start_time < NOW()
        AND coach_id=%s
        GROUP BY player_name, contact_phone_number, YEARWEEK(FROM_UNIXTIME(start_time))
        ORDER BY year_week, contact_phone_number
        LIMIT %s OFFSET %s;
        """

        results = execute_query(sql, (username, limit, offset))

        for invoice in results:
            player_name = invoice[0]
            contact_phone_number = invoice[1]
            count = invoice[2]
            sum = invoice[3]
            week_year = invoice[4]
            invoices.append({
                'player_name': player_name,
                'contact_phone_number': contact_phone_number,
                'count': count,
                'sum': sum,
                'week_year': week_year
            })

    elif view == 'monthly':
        sql = """
        SELECT
            player_name,
            contact_phone_number,
            COUNT(booking_id) AS bookings_count,
            SUM(cost) AS total_cost,
            YEAR(FROM_UNIXTIME(start_time)) AS year,
            MONTH(FROM_UNIXTIME(start_time)) AS month
        FROM Bookings
        WHERE start_time < UNIX_TIMESTAMP(NOW())
        AND coach_id=%s
        GROUP BY player_name, contact_phone_number, YEAR(FROM_UNIXTIME(start_time)), MONTH(FROM_UNIXTIME(start_time))
        ORDER BY year, month, contact_phone_number
        LIMIT %s OFFSET %s;
        """

        results = execute_query(sql, (username, limit, offset))

        for invoice in results:
            player_name = invoice[0]
            contact_phone_number = invoice[1]
            count = invoice[2]
            sum = invoice[3]
            year = invoice[4]
            month = invoice[5]
            invoices.append({
                'player_name': player_name,
                'contact_phone_number': contact_phone_number,
                'count': count,
                'sum': sum,
                'year': year,
                'month': month
            })

    else:
        return jsonify(message="Invalid view"), 400
    
    return jsonify(data=invoices), 200

@invoices.route('/timetable/send-invoice', methods=['POST'])
def send_invoice():
    # will be called by coaches to send an invoice via Stripe.
    # can only be invoked by coaches who have enabaled Stripe.
    # should allow day, weekly or monthly view. and should
    # accumulate all the charges owed and send it to the
    # corresponding coach 

    pass
