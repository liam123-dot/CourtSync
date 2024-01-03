from flask import Blueprint, jsonify, request
from datetime import datetime, timedelta
import time

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

GetInvoices2Blueprint = Blueprint("GetInvoices2", __name__)

def get_invoices(coach_id, status="pending", contact_email=None, limit=50, offset=0):
    if not coach_id:
        raise Exception("Coach ID is required")

    if status == 'upcoming':
        sql = """
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
                GROUP_CONCAT(Bookings.booking_id) as booking_ids
            FROM Bookings
            INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
            WHERE (Bookings.start_time < UNIX_TIMESTAMP()
            AND status='confirmed'
            AND Bookings.invoice_sent = 0 AND Bookings.paid = 0 AND Bookings.invoice_cancelled = 0 AND Contacts.invoice_type != 'none'

            ) AND Bookings.coach_id = %s
            GROUP BY contact_email, contact_name, Bookings.invoice_sent, Bookings.paid, Bookings.invoice_id, Bookings.invoice_cancelled, Contacts.invoice_type
        """
        
    elif status == 'pending':
        sql = """
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
                GROUP_CONCAT(Bookings.booking_id) as booking_ids
            FROM Bookings
            INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
            WHERE (Bookings.start_time < UNIX_TIMESTAMP()
            AND status='confirmed'
            AND Bookings.invoice_sent = 1 AND Bookings.paid = 0 AND Bookings.invoice_cancelled = 0 AND Contacts.invoice_type != 'none'

            ) AND Bookings.coach_id = %s
            GROUP BY contact_email, contact_name, Bookings.invoice_sent, Bookings.paid, Bookings.invoice_id, Bookings.invoice_cancelled, Contacts.invoice_type
        """
        
    elif status == 'completed':

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
                GROUP_CONCAT(Bookings.booking_id) as booking_ids
            FROM Bookings
            INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
            WHERE (Bookings.start_time < UNIX_TIMESTAMP()
            AND status='confirmed'
            AND (Bookings.invoice_sent = 1 AND Bookings.paid = 1 OR Bookings.invoice_cancelled = 1 OR paid_from='outside stripe')
            ) AND Bookings.coach_id = %s
            GROUP BY contact_email, contact_name, Bookings.invoice_sent, Bookings.paid, Bookings.invoice_id, Bookings.invoice_cancelled, Contacts.invoice_type
            """    
        
    # Execute the query
    result = execute_query(sql, [coach_id, ])
    
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
    status = request.args.get('status', 'pending')
    contact_email = request.args.get('contact_email')
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    date_conversion = get_dates()

    try:
        invoices = get_invoices(coach_id, status, contact_email, limit, offset)
        
        if status == 'upcoming':
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

def get_invoices_between_time(coach_id, contact_email=None, invoice_id=None, paid=None, invoice_sent=None, limit=50, offset=0):
    if not coach_id:
        raise Exception("Coach ID is required")

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
        AND invoice_cancelled = 0
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

    try:
        invoices = get_invoices_between_time(coach_id, contact_email, paid=paid, invoice_id=invoice_id, invoice_sent=invoice_sent, limit=limit, offset=offset)
        return jsonify(invoices=invoices), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@GetInvoices2Blueprint.route("/invoices/by-bookings/<booking_ids>", methods=["GET"])
def get_invoice_from_booking_ids_endpoint(booking_ids):
    
    token = request.headers.get("Authorization")
    
    if not token:
        return jsonify(error='Unauthorized'), 400
    
    coach = get_coach(token)
    
    if coach is None:
        return jsonify(error='Unauthorized'), 400
    
    booking_ids = booking_ids.split(',')
    
    invoices = get_invoice_from_booking_ids(booking_ids, coach['coach_id'])
    
    return jsonify(invoices=invoices), 200
    
def get_invoice_from_booking_ids(booking_id_list, coach_id):
    
    sql = """
        SELECT
            Contacts.email as contact_email,
            Contacts.name as contact_name,
            Players.name as player_name,
            Bookings.*
        FROM Bookings
        INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
        INNER JOIN Players ON Bookings.player_id = Players.player_id
        WHERE Bookings.coach_id=%s
        AND Bookings.booking_id IN %s
    """
    
    results = execute_query(sql, (coach_id, booking_id_list))
    
    return results
    

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
    