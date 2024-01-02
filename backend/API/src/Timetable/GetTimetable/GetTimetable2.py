from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import calendar
import json
import copy
import pytz

from src.Bookings.GetBookings.GetBookings import get_bookings
from src.CoachEvents.GetCoachEvents import get_coach_events
from src.Database.ExecuteQuery import execute_query
from src.Logs.WriteLog import write_log
from src.Users.GetSelf.GetSelf import get_coach

GetTimetable2Blueprint = Blueprint('GetTimetable2Blueprint', __name__)

def format_bookings(bookings):
    london_tz = pytz.timezone('Europe/London')

    for booking in bookings:
        write_log('check here')
        write_log(booking['start_time'])

        # Convert epoch to London timezone-aware datetime
        start_time = datetime.fromtimestamp(booking['start_time'], london_tz)
        write_log(start_time)

        # Format the start time
        booking['start'] = start_time.strftime('%Y-%m-%dT%H:%M:%S')
        write_log(booking['start'])

        # Calculate and format the end time
        end_time = start_time + timedelta(minutes=booking['duration'])
        booking['end'] = end_time.strftime('%Y-%m-%dT%H:%M:%S')

        booking['duration_minutes'] = booking['duration']
        booking['backgroundColor'] = 'lightgrey' if booking['status'] == 'cancelled' else ''
        booking['type'] = 'booking'
        
        booking['title'] = booking['player_name']
        
    return bookings

def format_coach_events(coach_events):
    for coach_event in coach_events:
        start_time = datetime.fromtimestamp(coach_event['start_time'])
        coach_event['start'] = start_time.strftime('%Y-%m-%dT%H:%M:%SZ')
        end_time = start_time + timedelta(minutes=coach_event['duration'])
        coach_event['end'] = end_time.strftime('%Y-%m-%dT%H:%M:%SZ')
        coach_event['duration_minutes'] = coach_event['duration']
        coach_event['backgroundColor'] = 'lightgrey' if coach_event['status'] == 'cancelled' else ''
        coach_event['type'] = 'coach_event'
        coach_event['inner_title'] = coach_event['title']
                
    return coach_events

def format_working_hours(coach_id):
    # need to format working hours into style layed out in FullCalendar docs
    # https://fullcalendar.io/docs/businessHours
    # businessHours: [ // specify an array instead
    # {
    #     daysOfWeek: [ 1, 2, 3 ], // Monday, Tuesday, Wednesday
    #     startTime: '08:00', // 8am
    #     endTime: '18:00' // 6pm
    # },
    # {
    #     daysOfWeek: [ 4, 5 ], // Thursday, Friday
    #     startTime: '10:00', // 10am
    #     endTime: '16:00' // 4pm
    # }
    # ]
    working_hours = execute_working_hours_query(coach_id)
    
    business_hours = []
    for working_hour in working_hours:
        start_time = working_hour['start_time']
        end_time = working_hour['end_time']
        if start_time is not None and end_time is not None:
            business_hour = {}
            day_of_week = working_hour['day_of_week']
            # Shift the days of the week by one
            day_of_week = (day_of_week + 1) % 7 if day_of_week < 6 else 0
            business_hour['daysOfWeek'] = [day_of_week]
            business_hour['startTime'] = "{:02d}:{:02d}".format(*divmod(start_time, 60))
            business_hour['endTime'] = "{:02d}:{:02d}".format(*divmod(end_time, 60))
            business_hours.append(business_hour)
            
    return business_hours



@GetTimetable2Blueprint.route('/timetable', methods=['GET'])
def get_timetable_endpoint():
    
    write_log('get_timetable_endpoint')
    
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'No token provided'}), 400
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    from_time = request.args.get('fromTime')
    to_time = request.args.get('toTime')
    show_cancelled = request.args.get('showCancelled', False) == 'true'

    bookings = get_bookings(coach['coach_id'], from_time=from_time, to_time=to_time, status=None if show_cancelled else 'confirmed')
    bookings = format_bookings(bookings)
    
    coach_events = get_coach_events(coach['coach_id'], from_time=from_time, to_time=to_time, include_cancelled=show_cancelled)
    coach_events = format_coach_events(coach_events)
    
    all = []
    all.extend(bookings)
    all.extend(coach_events)
    
    repeating_bookings = get_repeating_bookings(coach['coach_id'], from_time, to_time)
    repeating_bookings = format_bookings(repeating_bookings)
    write_log(f"repeating_bookings: {repeating_bookings}")
    all.extend(repeating_bookings)
    
    return jsonify(
        events=all,        
        businessHours=format_working_hours(coach['coach_id'])
    ), 200
    
@GetTimetable2Blueprint.route('/timetable/working-hours', methods=['GET'])
def get_working_hours_endpoint():
        
    token = request.headers.get('Authorization')
    
    coach = get_coach(token)
    
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    results = execute_working_hours_query(coach['coach_id'])
    
    return jsonify(results), 200

def execute_working_hours_query(coach_id):
    
    sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s"
    
    results = execute_query(sql, (coach_id, ))
        
    return results

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
    """

    results = execute_query(sql, (coach_id, ))
    
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
                'to_time': to_time
            }
        else:
            from_time = collect_by_cron[result['cron']]['from_time']
            to_time = collect_by_cron[result['cron']]['to_time']
        
        if result['start_time'] >= from_time and result['start_time'] <= to_time:            
            collect_by_cron[result['cron']]['lessons'].append(result)
            
    write_log(f"collected by cron: {collect_by_cron.keys()}")
            
    for cron in collect_by_cron.keys():
        
        cron_data = collect_by_cron[cron]
        expected_count = cron_data['expected_count']
        actual_count = len(cron_data['lessons'])        
        
        write_log(cron)
        write_log(f"expected_count: {expected_count}, actual_count: {actual_count}")
        
        if expected_count != actual_count:
            cron_data['lessons'] = fill_in_blanks(cron, cron_data, cron_data['from_time'], cron_data['to_time'])
    
    to_be_added = []
    
    # iterate through all the cron jobs and remove the lessons with a 
    # booking id that isn't -1
    
    for cron in collect_by_cron.keys():
        for lesson in collect_by_cron[cron]['lessons']:
            if lesson['booking_id'] == -1:
                to_be_added.append(lesson)
        
    return to_be_added


def calculate_expected_count(from_time, to_time, cron_job):
    # Split cron_job into its components
    write_log(f"calculate_expected_count: {from_time}, {to_time}, {cron_job}")

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
    
    write_log(json.dumps(cron_data, indent=4))
    
    cron_execution_times = get_cron_execution_times(from_time, to_time, cron)
    cron_dict = {int(time.timestamp()): None for time in cron_execution_times}

    for lesson in cron_data['lessons']:
        if lesson['start_time'] in cron_dict.keys():
            cron_dict[lesson['start_time']] = lesson
            
    write_log(f"cron_dict: {cron_dict}")
        
    for key in cron_dict.keys():
        if cron_dict[key] is None:
            cron_dict[key] = copy.deepcopy(cron_data['template'])
            cron_dict[key]['booking_id'] = -1            
            cron_dict[key]['start_time'] = key
            cron_dict[key]['status'] = 'confirmed'
            cron_dict[key]['paid'] = False
            cron_dict[key]['message_from_couch'] = None
            cron_dict[key]['message_from_player'] = None
            cron_dict[key]['hash'] = -1
            cron_dict[key]['invoice_sent'] = False
            cron_dict[key]['time_invoice_sent'] = None
            cron_dict[key]['invoice_id'] = None
            cron_dict[key]['paid_from'] = None
            cron_dict[key]['invoice_cancelled'] = False
            cron_dict[key]['send_date'] = None
            cron_dict[key]['based_of'] = cron_data['template']['booking_id']            
        
    write_log(f"cron_dict: {cron_dict}")
        
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
