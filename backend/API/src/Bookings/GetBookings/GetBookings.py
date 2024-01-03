from flask import Flask, request, jsonify, current_app, Blueprint
from datetime import datetime, timedelta

import calendar
import json
import time
import copy

from src.Bookings.AddBooking.CalculateLessonCost import calculate_lesson_cost
from src.Bookings.AddBooking.InsertBooking import insert_booking
from src.Bookings.GetBooking import get_booking_by_hash
from src.Database.ExecuteQuery import execute_query
from src.Logs.WriteLog import write_log
from src.Users.GetSelf.GetSelf import get_coach


GetBookingsBlueprint = Blueprint('GetBookings', __name__)

def get_bookings(coach_id, 
                 from_time=None, 
                 to_time=None, 
                 invoice_sent=None, 
                 invoice_paid=None, 
                 contact_id=None, 
                 player_id=None,
                 status=None
                 ):
    
    args = (coach_id,)
    
    if from_time is not None and to_time is not None:
        time_period = "AND Bookings.start_time >= %s AND Bookings.start_time <= %s"
        args += (from_time, to_time)
    else:
        time_period = ""    
        
    invoice_sent_query = ""
    if invoice_sent is not None:
        invoice_sent_query += "AND Bookings.invoice_sent = %s"
        args += (invoice_sent,)
                
    invoice_paid_query = ""
    if invoice_paid is not None:
        invoice_paid_query += "AND Bookings.paid = %s"
        args += (invoice_paid,)
        
    contact_id_query = ""
    if contact_id is not None:
        contact_id_query += "AND Bookings.contact_id = %s"
        args += (contact_id,)
        
    player_id_query = ""
    if player_id is not None:
        player_id_query += "AND Bookings.player_id = %s"
        args += (player_id,)
                
    status_query = ""
    if status is not None:
        status_query += "AND Bookings.status = %s"
        args += (status,)
                
    sql = f"""
        SELECT 
            Bookings.*,
            Contacts.name AS contact_name,
            Contacts.email AS contact_email,
            Contacts.phone_number AS contact_phone_number,
            Players.name AS player_name,
            GROUP_CONCAT(PricingRules.rule_id) AS pricing_rule_ids,
            RepeatRules.repeat_frequency,
            RepeatRules.repeat_until
        FROM 
            Bookings
        INNER JOIN 
            Contacts ON Bookings.contact_id = Contacts.contact_id
        INNER JOIN 
            Players ON Bookings.player_id = Players.player_id
        LEFT JOIN 
            BookingsPricingJoinTable ON Bookings.booking_id = BookingsPricingJoinTable.booking_id
        LEFT JOIN 
            PricingRules ON BookingsPricingJoinTable.rule_id = PricingRules.rule_id
        LEFT JOIN 
            RepeatRules ON Bookings.repeat_id = RepeatRules.repeat_id
        WHERE 
            Bookings.coach_id = %s
            AND (Bookings.repeat_id IS NULL)
            {time_period}
            {invoice_sent_query}
            {invoice_paid_query}
            {contact_id_query}
            {player_id_query}
            {status_query}
        GROUP BY 
            Bookings.booking_id
    """
    
    bookings = execute_query(sql, args, is_get_query=True)
            
    if from_time is not None and to_time is not None:
        repeating_bookings = get_repeating_bookings(coach_id, from_time, to_time)
        bookings.extend(repeating_bookings)

    return bookings


@GetBookingsBlueprint.route('/bookings', methods=['GET'])
def get_bookings_endpoint():
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400

    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    # get from and to time from query string, if provided, otherwise set to None
    
    from_time = request.args.get('from_time')
    to_time = request.args.get('to_time')
    invoice_sent = request.args.get('invoice_sent')
    invoice_paid = request.args.get('invoice_paid')
    
    if invoice_sent:
        invoice_sent = invoice_sent == 'true'
    if invoice_paid:
        invoice_paid = invoice_paid == 'true'
    
    bookings = get_bookings(coach['coach_id'], from_time=from_time, to_time=to_time, invoice_sent=invoice_sent, invoice_paid=invoice_paid)
    
    return jsonify(bookings), 200


def get_repeating_bookings(coach_id, initial_from_time, initial_to_time):
    
    initial_from_time = int(initial_from_time)
    initial_to_time = int(initial_to_time)
    
    sql = """
        SELECT 
            Bookings.*,
            Contacts.name as contact_name,
            Contacts.email as contact_email,
            Contacts.phone_number as contact_phone_number,
            Players.name as player_name,
            RepeatRules.repeat_id,
            RepeatRules.cron,
            RepeatRules.start_time as repeat_start_time,
            RepeatRules.repeat_until as repeat_until
        FROM RepeatRules
        INNER JOIN Bookings ON Bookings.repeat_id=RepeatRules.repeat_id
        INNER JOIN Contacts ON Bookings.contact_id=Contacts.contact_id
        INNER JOIN Players ON Bookings.player_id=Players.player_id
        WHERE RepeatRules.coach_id=%s
        AND RepeatRules.is_active=1
        AND NOT (RepeatRules.start_time > %s OR (RepeatRules.repeat_until IS NOT NULL AND RepeatRules.repeat_until < Bookings.start_time ))
    """        

    results = execute_query(sql, (coach_id, initial_to_time), is_get_query=True)
    
    collect_by_cron = {}
    
    for result in results:        
        from_time = initial_from_time
        to_time = initial_to_time
        
        if result['cron'] not in collect_by_cron.keys():                        
            repeat_start_time = result['repeat_start_time']
            if from_time < repeat_start_time:
                from_time = repeat_start_time
            if result['repeat_until'] is not None and to_time > result['repeat_until']:            
                to_time = result['repeat_until']
                
            collect_by_cron[result['cron']] = {
                'lessons': [],
                'expected_count': calculate_expected_count(from_time, to_time, result['cron']),
                'template': result,
                'from_time': from_time,
                'to_time': to_time,
                'repeat_until': result['repeat_until']
            }            
        else:
            from_time = collect_by_cron[result['cron']]['from_time']
            to_time = collect_by_cron[result['cron']]['to_time']
        
        if result['start_time'] >= from_time and result['start_time'] <= to_time:            
            collect_by_cron[result['cron']]['lessons'].append(result)    
            
    write_log(f"Calculate results for cron rules: {json.dumps(collect_by_cron, indent=4)}")
            
    for cron in collect_by_cron.keys():
        
        cron_data = collect_by_cron[cron]
        expected_count = cron_data['expected_count']
        actual_count = len(cron_data['lessons'])
        
        if expected_count != actual_count:
            cron_data['lessons'] = fill_in_blanks(cron, cron_data, cron_data['from_time'], cron_data['to_time'])
    
    to_be_added = []
    
    # iterate through all the cron jobs and remove the lessons with a 
    # booking id that isn't -1
    
    for cron in collect_by_cron.keys():        
        for lesson in collect_by_cron[cron]['lessons']:
            
            to_be_added.append(lesson)
        
    return to_be_added


def calculate_expected_count(from_time, to_time, cron_job):
    write_log(f"Calculating expected count for cron job: {cron_job} between {from_time} and {to_time}")

    # Convert epoch seconds to datetime objects
    start_date = datetime.fromtimestamp(from_time)
    end_date = datetime.fromtimestamp(to_time)

    count = 0
    current_date = start_date

    while current_date <= end_date:
        if does_datetime_satisfy_cron(current_date, cron_job):
            write_log(current_date)
            count += 1
        current_date += timedelta(minutes=1)

    return count

def parse_cron_field(field, max_value):
    if field == "*":
        return set(range(max_value))
    parts = set()
    for part in field.split(','):
        if '-' in part:
            start, end = map(int, part.split('-'))
            parts.update(range(start, end + 1))
        else:
            parts.add(int(part))
    return parts

def does_datetime_satisfy_cron(dt, cron_expression):
    fields = cron_expression.split()
    if len(fields) != 5:
        raise ValueError("Invalid cron expression")

    minutes = parse_cron_field(fields[0], 60)
    hours = parse_cron_field(fields[1], 24)
    days = parse_cron_field(fields[2], 32)
    months = parse_cron_field(fields[3], 13)
    weekdays = parse_cron_field(fields[4], 7)

    if dt.minute in minutes and dt.hour in hours and dt.day in days and dt.month in months and dt.weekday() in weekdays:
        return True
    return False


def is_cron_match(date, minute, hour, dom, month, dow):
    # Convert '*' to the appropriate value for comparison
    minute = date.minute if minute == '*' else int(minute)
    hour = date.hour if hour == '*' else int(hour)
    dom = date.day if dom == '*' else int(dom)
    month = date.month if month == '*' else int(month)
    dow = date.weekday() if dow == '*' else int(dow)

    # Adjusted logic for day of month and day of week
    dom_match = True if dom == '*' else (date.day == dom or dom > calendar.monthrange(date.year, date.month)[1])
    dow_match = True if dow == '*' else date.weekday() == dow

    # The job runs if both time and either day of month or day of week match
    return (date.minute == minute and
            date.hour == hour and
            date.month == month and
            (dom_match or dow_match))

    
def fill_in_blanks(cron, cron_data, from_time, to_time):
        
    cron_execution_times = get_cron_execution_times(from_time, to_time, cron)
    cron_dict = {int(time.timestamp()): None for time in cron_execution_times}

    for lesson in cron_data['lessons']:
        if lesson['start_time'] in cron_dict.keys():
            cron_dict[lesson['start_time']] = lesson
                    
    write_log(f"cron_dict: {json.dumps(cron_dict, indent=4)}")
    current_time = time.time()
       
    for key in cron_dict.keys():
        if cron_dict[key] is None:
            # if key > current_time:
            #     cron_dict[key] = copy.deepcopy(cron_data['template'])
            #     cron_dict[key]['booking_id'] = -1            
            #     cron_dict[key]['start_time'] = key
            #     cron_dict[key]['status'] = 'confirmed'
            #     cron_dict[key]['paid'] = False
            #     cron_dict[key]['message_from_couch'] = None
            #     cron_dict[key]['message_from_player'] = None
            #     cron_dict[key]['hash'] = -1
            #     cron_dict[key]['invoice_sent'] = False
            #     cron_dict[key]['time_invoice_sent'] = None
            #     cron_dict[key]['invoice_id'] = None
            #     cron_dict[key]['paid_from'] = None
            #     cron_dict[key]['invoice_cancelled'] = False
            #     cron_dict[key]['send_date'] = None
            #     cron_dict[key]['based_of'] = cron_data['template']['booking_id']
            # else:
            write_log("Need to create a new booking based of template")
            lesson_cost, rules = calculate_lesson_cost(key, cron_data['template']['duration'], cron_data['template']['coach_id'])
            booking_hash = insert_booking(
                cron_data['template']['player_id'],
                cron_data['template']['contact_id'],
                key,
                lesson_cost,
                rules,
                cron_data['template']['duration'],
                cron_data['template']['coach_id'],
                int(time.time()),
                repeat_id=cron_data['template']['repeat_id'],
                coach_id=cron_data['template']['coach_id']
            )
            cron_dict[key] = get_booking_by_hash(booking_hash)
            cron_dict[key]['just_added'] = True
                
    return list(cron_dict.values())

def get_cron_execution_times(start_epoch, end_epoch, cron_expression):
    # Split the cron expression
    minute, hour, day_of_month, month, day_of_week = cron_expression.split()
    
    # Convert start and end epochs to datetime
    start_datetime = datetime.fromtimestamp(start_epoch)
    end_datetime = datetime.fromtimestamp(end_epoch)

    # List to hold all the matching times
    execution_times = []

    current_datetime = start_datetime
    while current_datetime <= end_datetime:
        if matches_cron(current_datetime, minute, hour, day_of_month, month, day_of_week):
            execution_times.append(current_datetime)

        # Increment by one minute
        current_datetime += timedelta(minutes=1)

    return execution_times

def matches_cron(dt, minute, hour, dom, month, dow):
    # Function to check if a datetime matches the cron expression
    if minute != '*' and dt.minute != int(minute):
        return False
    if hour != '*' and dt.hour != int(hour):
        return False
    if dom != '*' and dt.day != int(dom):
        return False
    if month != '*' and dt.month != int(month):
        return False
    if dow != '*' and dt.weekday() != int(dow):
        return False
    return True
