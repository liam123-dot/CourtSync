from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import time

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

GetInvoices2Blueprint = Blueprint("GetInvoices2", __name__)

def get_invoices(coach_id, frequency="daily", status="pending", contact_email=None, limit=50, offset=0):
    if not coach_id:
        raise Exception("Coach ID is required")

    # Determine time grouping based on frequency
    if frequency == 'daily':
        time_group = "DAYOFMONTH(FROM_UNIXTIME(start_time)) as day, MONTH(FROM_UNIXTIME(start_time)) as month, YEAR(FROM_UNIXTIME(start_time)) as year"
        group_by = "day, month, year"
        order_by = "year, month, day"
    elif frequency == 'weekly':
        time_group = "WEEK(FROM_UNIXTIME(start_time)) as week, YEAR(FROM_UNIXTIME(start_time)) as year"
        group_by = "week, year"
        order_by = "year, week"
    elif frequency == 'monthly':
        time_group = "MONTH(FROM_UNIXTIME(start_time)) as month, YEAR(FROM_UNIXTIME(start_time)) as year"
        group_by = "month, year"
        order_by = "year, month"

    # Prepare the SQL query
    sql = f"""
    SELECT
        Contacts.email as contact_email,
        Contacts.name as contact_name,
        Contacts.invoice_type as invoice_type,
        Bookings.invoice_sent,
        Bookings.paid,
        Bookings.invoice_id,
        COUNT(Bookings.booking_id) as bookings_count,
        SUM(Bookings.cost) AS total_cost,
        SUM(Bookings.extra_costs) AS total_extra_costs,
        Bookings.invoice_cancelled as invoice_cancelled,
        GROUP_CONCAT(Bookings.booking_id) as booking_ids,
        {time_group}
    FROM Bookings
    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
    WHERE (Bookings.start_time < UNIX_TIMESTAMP()
    AND status='confirmed'
    """
    
    args = [coach_id]
    # Adding contact email condition if provided
    if contact_email:
        sql += " AND Contacts.email = %s"
        args.append(contact_email)

    # Modify the query based on the status
    if status == "upcoming":
        sql += " AND Bookings.invoice_sent = 0 AND Bookings.paid = 0 AND Bookings.invoice_cancelled = 0"
        
    elif status == "pending":
        sql += " AND Bookings.invoice_sent = 1 AND Bookings.paid = 0 AND Bookings.invoice_cancelled = 0"
    elif status == "completed":
        sql += " AND Bookings.invoice_sent = 1 AND Bookings.paid = 1"
        sql += " OR Bookings.invoice_cancelled = 1 OR paid_from='outside stripe'"
    
        
    sql += " ) AND Bookings.coach_id = %s"

    sql += f" GROUP BY contact_email, {group_by}, contact_name, Bookings.invoice_sent, Bookings.paid, Bookings.invoice_id, Bookings.invoice_cancelled, Contacts.invoice_type"
    sql += f" ORDER BY {order_by}"
    sql += " LIMIT %s OFFSET %s"
    args.extend([limit, offset])

    # Execute the query
    result = execute_query(sql, args)
    
    dates = get_dates()        
    
    return result



@GetInvoices2Blueprint.route("/invoices", methods=["GET"])
def get_invoices_endpoint():
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"error": "Authorization header missing"}), 400
    
    coach = get_coach(token)
    
    if coach is None:
        return jsonify({"error": "Invalid token"}), 400
    
    coach_id = coach["coach_id"]

    # Extract query parameters
    frequency = request.args.get('frequency', 'daily')
    status = request.args.get('status', 'pending')
    contact_email = request.args.get('contact_email')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    date_conversion = get_dates()

    try:
        invoices = get_invoices(coach_id, frequency, status, contact_email, limit, offset)
        
        for i in range(0, len(invoices)):        
            invoice = invoices[i]
            if 'send_date' not in invoice.keys():
                invoice_type = invoice['invoice_type']
                if invoice_type == 'default':
                    invoice['invoice_type'] = coach['invoice_type']
                    
                invoices[i]['send_date'] = date_conversion[invoice['invoice_type']]
                
        # sort by send_date which is in the format dd/mm/yyyy
        
        invoices = sorted(invoices, key=lambda k: datetime.strptime(k['send_date'], '%d/%m/%Y'))
        
        return jsonify(invoices=invoices, invoices_initialised=True), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@GetInvoices2Blueprint.route("/invoices/status", methods=["GET"])
def get_invoicing_status_endpoint():
    
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify({"error": "Authorization header missing"}), 400
    
    coach = get_coach(token)
    if coach is None:
        return jsonify({"error": "Invalid token"}), 400
    
    invoices_initialised = coach['invoice_type'] is not None and coach['stripe_account_set_up']
    
    return jsonify(
        invoice_type=coach['invoice_type'],
        invoices_initialised=invoices_initialised
    ), 200

def get_invoices_between_time(coach_id, start_time, end_time, contact_email=None, invoice_id=None, paid=None, invoice_sent=None, limit=50, offset=0):
    if not coach_id:
        raise Exception("Coach ID is required")
    if not start_time or not end_time:
        raise Exception("Both start time and end time are required")

    # Prepare the SQL query
    sql = """
    SELECT
        Contacts.email as contact_email,
        Contacts.name as contact_name,
        Players.name as player_name,
        Bookings.*
    FROM Bookings
    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
    INNER JOIN Players ON Bookings.player_id = Players.player_id
    AND status='confirmed'
    AND Bookings.start_time < UNIX_TIMESTAMP()
    AND Bookings.coach_id = %s
    """
    
    args = [coach_id, ]

    # Adding contact email condition if provided
    if contact_email:
        sql += " AND Contacts.email = %s"
        args.append(contact_email)
        
    if paid is not None:
        sql += " AND Bookings.paid = %s"
        args.append(paid)
        
    if invoice_sent is not None:
        sql += " AND Bookings.invoice_sent = %s"
        args.append(invoice_sent)
        
    if invoice_id is not None:
        sql += " AND Bookings.invoice_id = %s"
        args.append(invoice_id)

    sql += " ORDER BY Bookings.start_time"
    sql += " LIMIT %s OFFSET %s"
    args.extend([limit, offset])

    # Execute the query
    result = execute_query(sql, args)
    return result


@GetInvoices2Blueprint.route("/invoices/time-range", methods=["GET"])
def get_invoices_time_range_endpoint():
    token = request.headers.get("Authorization")

    if not token:
        return jsonify({"error": "Authorization header missing"}), 400

    coach = get_coach(token)
    if coach is None:
        return jsonify({"error": "Invalid token"}), 400

    coach_id = coach["coach_id"]

    # Extract query parameters for time range
    start_time = request.args.get('start_time')
    end_time = request.args.get('end_time')
    contact_email = request.args.get('contact_email')
    paid = request.args.get('paid', None)
    invoice_sent = request.args.get('invoice_sent', None)
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    invoice_id = request.args.get('invoice_id', None)

    if paid is not None:
        paid = paid == 'true'
        
    if invoice_sent is not None:
        invoice_sent = invoice_sent == 'true'
        
        
    print('paid, invoice_sent')
    print( paid, invoice_sent)

    # Validate time parameters
    if not start_time or not end_time:
        return jsonify({"error": "start_time and end_time parameters are required"}), 400

    try:
        start_time = int(start_time)
        end_time = int(end_time)
    except ValueError:
        return jsonify({"error": "Invalid start_time or end_time. They should be epoch timestamps"}), 400

    try:
        invoices = get_invoices_between_time(coach_id, start_time, end_time, contact_email, paid=paid, invoice_id=invoice_id, invoice_sent=invoice_sent, limit=limit, offset=offset)
        return jsonify(invoices=invoices), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def get_dates():
    # Get the current date
    current_date = datetime.fromtimestamp(int(time.time()))

    # Calculate the next day
    next_day = current_date + timedelta(days=1)

    # Calculate the Monday of the next week
    days_until_next_monday = (7 - current_date.weekday()) % 7
    if days_until_next_monday == 0:
        days_until_next_monday = 7
    next_monday = current_date + timedelta(days=days_until_next_monday)

    # Calculate the 1st of the next month
    if current_date.month == 12:
        next_month_first = datetime(current_date.year + 1, 1, 1)
    else:
        next_month_first = datetime(current_date.year, current_date.month + 1, 1)

    # Format the dates and return them in a dictionary
    return {
        "daily": next_day.strftime("%d/%m/%Y"),
        "weekly": next_monday.strftime("%d/%m/%Y"),
        "monthly": next_month_first.strftime("%d/%m/%Y")
    }
    