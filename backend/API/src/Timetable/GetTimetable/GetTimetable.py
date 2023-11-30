from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
import asyncio
import math

from src.Users.GetSelf.GetSelf import get_coach, get_coach_from_slug
from src.Timetable.GetTimetable.GetTimetableHelpers import epoch_to_date, calculate_indexes_to_dates
from src.Timetable.GetTimetable.CalculateOverlaps import calculate_overlaps, reconstructe_bookings_and_events
from src.Bookings.GetBookings.GetBookings import get_bookings as perform_get_bookings

from src.Database.ExecuteQuery import execute_query

logging.basicConfig(level=logging.DEBUG)

GetTimetableBlueprint = Blueprint('GetTimetable', __name__)

# ----- GET BOOKINGS -----

def construct_sql_query_bookings(authorised):
    if authorised:
        sql = "SELECT booking_id, player_name, contact_name, contact_email, contact_phone_number, start_time, status, duration, cost, paid FROM Bookings WHERE coach_id=%s AND %s < start_time AND start_time < %s"
    else:
        sql = "SELECT booking_id, player_name, contact_name, contact_email, contact_phone_number, start_time, status, duration, cost, paid FROM Bookings WHERE coach_id=%s AND %s < start_time AND start_time < %s AND status!=\"cancelled\""
        
    return sql

def process_results_bookings(results, authorised):
    bookings = {}
    
    for booking in results:
        date = epoch_to_date(booking['start_time'])
        if date not in bookings.keys():
            bookings[date] = []
        new_booking = construct_new_booking(booking, authorised)
        bookings[date].append(new_booking)
        
    return bookings

def construct_new_booking(booking, authorised):
    all_keys = ['booking_id', 'player_name', 'contact_name', 'contact_email', 'contact_phone_number', 'start_time', 'status', 'duration', 'cost', 'paid']
    authorised_keys = ['start_time', 'status', 'duration', 'booking_id']
    
    if authorised:
        keys = all_keys
    else:
        keys = authorised_keys

    new_booking = {key: booking[key] for i, key in enumerate(all_keys) if key in keys}
    return new_booking
        
def get_bookings(coach_id, from_time, to_time, authorised):
    
    sql = construct_sql_query_bookings(authorised)    
        
    bookings = perform_get_bookings(coach_id)
    
    bookings = process_results_bookings(bookings, authorised)
    
    return bookings

# ----- GET COACH EVENTS -----

def construct_sql_coach_events(authorised):
    if authorised:
        sql = "SELECT event_id, start_time, duration, title, description FROM CoachEvents WHERE coach_id=%s AND %s < start_time AND start_time < %s"
    else:
        sql = "SELECT start_time, duration FROM CoachEvents WHERE coach_id=%s AND %s < start_time AND start_time < %s "
    return sql

def construct_new_coach_event(coach_event, authorised):
    all_keys = ['event_id', 'start_time', 'duration', 'title', 'description']
    authorised_keys = ['start_time', 'duration']

    if authorised:
        keys = all_keys
    else:
        keys = authorised_keys

    new_coach_event = {key: coach_event[key] for i, key in enumerate(all_keys) if key in keys}
    return new_coach_event

def process_results_coach_events(results, authorised):
    coach_events = {}
    for coach_event in results:
        date = epoch_to_date(coach_event['start_time'])
        if date not in coach_events.keys():
            coach_events[date] = []
        new_coach_event = construct_new_coach_event(coach_event, authorised)
        coach_events[date].append(new_coach_event)
    return coach_events

def get_coach_events(coach_id, from_time, to_time, authorised):
    sql = construct_sql_coach_events(authorised)

    results = execute_query(sql, (coach_id, from_time, to_time))
        
    coach_events = process_results_coach_events(results, authorised)
    return coach_events

# ----- GET WORKING HOURS -----

def execute_working_hours_query(coach_id):
    
    sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s"
    
    results = execute_query(sql, (coach_id, ))
        
    return results

def process_working_hours_results(results, start_date, end_date):
    working_hours = {}
    day_index_to_date = calculate_indexes_to_dates(
        start_date=start_date,
        end_date=end_date
    )
    for result in results:
                
        if result['day_of_week'] in day_index_to_date.keys():
            day_index = day_index_to_date[result['day_of_week']]
            working_hours[day_index] = result
            
    return working_hours

def get_working_hours(coach_id, start_date, end_date):
    results = execute_working_hours_query(coach_id)
    working_hours = process_working_hours_results(results, start_date, end_date)
    return working_hours

# ----- GET DEFAULT WORKING HOURS -----

def execute_default_working_hours_query(coach_id):
    sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s AND is_default=1"

    results = execute_query(sql, (coach_id, ))

    return results

def process_default_working_hours_results(results):
    working_hours = {}
    
    for result in results:        
        
        working_hours[result['day_of_week']] = result

    return working_hours

def get_default_working_hours(coach_id):
    try:
        results = execute_default_working_hours_query(coach_id)
    except Exception as e:
        return None
    working_hours = process_default_working_hours_results(results)
    return working_hours
    
# ----- GET PRICING RULES -----

def execute_pricing_rules_query(coach_id):
    
    sql = "SELECT rule_id, hourly_rate, is_default, start_time, end_time FROM PricingRules WHERE coach_id=%s"
    
    results = execute_query(sql, (coach_id, ))
        
    return results

def process_pricing_rules_results(results):
    pricing_rules = {}
    for result in results:

        if result['start_time']:
            date = epoch_to_date(result['start_time'])
        else:
            date = 'default'
        if date not in pricing_rules.keys():
            pricing_rules[date] = []
                
        if date == 'default':
            pricing_rules['default'] = result
            
        else:
            pricing_rules[date].append(result)
    return pricing_rules

def get_pricing_rules(coach_id):
    try:
        results = execute_pricing_rules_query(coach_id)
    except Exception as e:
        return None
    pricing_rules = process_pricing_rules_results(results)
    return pricing_rules

# ----- GET DURATIONS -----

def get_durations(coach_id):
    
    sql = 'SELECT duration FROM Durations WHERE coach_id=%s'
    try:
    
        results = execute_query(sql, (coach_id, ))
        
    except Exception:
        return None

    durations = sorted([row['duration'] for row in results])
    return durations


# ----- GET TIMETABLE -----

@GetTimetableBlueprint.route('/timetable/<slug>', methods=['GET'])
def get_timetable(slug):
    
    try:
        from_time = int(request.args.get('from_time'))
        to_time = int(request.args.get('to_time'))
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing query string parameter: {e}")
    except (ValueError, TypeError) as e:
        return jsonify(message='Times must be valid integers'), 400
    
    token = request.headers.get('Authorization')
    
    if token:
        coach = get_coach(token)
        if not coach:
            return jsonify(exists=False), 200
        authorised = False
        if token and coach:
            if slug == coach['slug']:
                authorised = True
    else:
        authorised = False
        coach = get_coach_from_slug(slug)
        if not coach:
            return jsonify(exists=False), 200
    coach_id = coach['coach_id']
    
        
    start_date = epoch_to_date(from_time)
    end_date = epoch_to_date(to_time)
    
    bookings = get_bookings(coach_id, from_time, to_time, authorised)
    coach_events = get_coach_events(coach_id, from_time, to_time, authorised)
    working_hours = get_working_hours(coach_id, start_date, end_date)
    default_working_hours = get_default_working_hours(coach_id)
    durations = get_durations(coach_id)
    pricing_rules = get_pricing_rules(coach_id)
    
    global_min, global_max = get_global_min_max(working_hours)
    
    all = get_all(bookings, coach_events, working_hours, global_min, global_max)
    
    bookings, coach_events = process_overlaps(bookings, coach_events)
    
    if authorised:
        return jsonify(
            authorised=authorised,
            bookings=bookings,
            coach_events=coach_events,
            default_working_hours=default_working_hours,
            durations=durations,
            exists=True,
            pricing_rules=pricing_rules,
            working_hours=working_hours,
            all=all,
            global_min=global_min,
            global_max=global_max,
            coach_set_up = coach['coach_setup']
        ), 200
    else:
        return jsonify(
            authorised=authorised,
            all=all,
            exists=True,
            pricing_rules=pricing_rules,
            durations=durations,
            global_min=global_min,
            global_max=global_max,
            coach_set_up = coach['coach_setup']
        ), 200

def get_global_min_max(working_hours):
    global_min = None
    global_max = None
    
    for key in working_hours:
        if working_hours[key]['start_time'] and working_hours[key]['end_time']:
            if not global_min:
                global_min = working_hours[key]['start_time']
            elif working_hours[key]['start_time'] < global_min:
                global_min = working_hours[key]['start_time']
                
            if not global_max:
                global_max = working_hours[key]['end_time']
            elif working_hours[key]['end_time'] > global_max:
                global_max = working_hours[key]['end_time']
                
    if not global_min:
        global_min = 12
    if not global_max:
        global_max = 12
                
    return math.floor(global_min / 60), math.ceil(global_max / 60)

def get_coach_id(slug):
    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"

    try:
        coach_id = execute_query(sql, (slug,))[0]['coach_id']
        return coach_id
    except IndexError:
        return None
    
    
def process_overlaps(bookings, coach_events):
    temp_dict = {}
    bookings_dates = list(bookings.keys())
    coach_events_dates = list(coach_events.keys())
    dates = []
    dates.extend(bookings_dates)
    dates.extend(coach_events_dates)
    dates = list(set(dates))
    
    for date in dates:
        temp_dict[date] = []
        if date in bookings.keys():
            temp_dict[date].extend(bookings[date])
        if date in coach_events.keys():
            temp_dict[date].extend(coach_events[date])
            
    temp_dict = calculate_overlaps(temp_dict)
    
    bookings, coach_events = reconstructe_bookings_and_events(temp_dict)
    return bookings, coach_events

def get_all(bookings, coach_events, working_hours, global_min, global_max):
    all = {}

    for key in bookings:
        if key not in all.keys():
            all[key] = []
        
        for booking in bookings[key]:
            all[key].append({
                'type': 'booking',
                'start_time': booking['start_time'],
                'duration': booking['duration']
            })
            
    for key in coach_events:
        if key not in all.keys():
            all[key] = []
        
        for coach_event in coach_events[key]:
            all[key].append({
                'type': 'coach_event',
                'start_time': coach_event['start_time'],
                'duration': coach_event['duration']
            })
            
    for key in working_hours:
        if key not in all.keys():
            all[key] = []
        
        if not working_hours[key]['start_time'] and not working_hours[key]['end_time']:
            # key is the date dd-mm-yyyy. If no start_time or end_time, set start_time to global_min and end_time to global_max in epoch
            start_time = datetime.strptime(key, "%d-%m-%Y").replace(hour=global_min, minute=0, second=0, microsecond=0).timestamp()
            end_time = datetime.strptime(key, "%d-%m-%Y").replace(hour=global_max, minute=0, second=0, microsecond=0).timestamp()
            duration = int((end_time - start_time) / 60)
            
            all[key].append({
                'type': 'working_hour',
                'start_time': int(start_time),
                'duration': duration,
                'start_time_without_global': 0,
                'duration_without_global': 1440
            })
        else:
            # the start time and end time are in minutes. Representing how many minutes into the day they are. Get the epoch time
            start_time = datetime.strptime(key, "%d-%m-%Y").replace(hour=0, minute=0, second=0, microsecond=0).timestamp() + (working_hours[key]['start_time'] * 60)
            end_time = datetime.strptime(key, "%d-%m-%Y").replace(hour=0, minute=0, second=0, microsecond=0).timestamp() + (working_hours[key]['end_time'] * 60)
            
            # Add working hour block from global_min to start_time
            start_time_min = datetime.strptime(key, "%d-%m-%Y").replace(hour=global_min, minute=0, second=0, microsecond=0).timestamp()
            duration_min = int((start_time - start_time_min) / 60)
            
            all[key].append({
                'type': 'working_hour',
                'start_time': int(start_time_min),
                'duration': duration_min,
                'start_time_without_global': 0,
                'duration_without_global': working_hours[key]['start_time']
            })
            
            # Add working hour block from end_time to global_max
            end_time_max = datetime.strptime(key, "%d-%m-%Y").replace(hour=global_max, minute=0, second=0, microsecond=0).timestamp()
            duration_max = int((end_time_max - end_time) / 60)
            
            all[key].append({
                'type': 'working_hour',
                'start_time': int(end_time),
                'duration': duration_max,
                'start_time_without_global': working_hours[key]['end_time'],
                'duration_without_global': 1440 - working_hours[key]['end_time']
            })

    return all
    

@GetTimetableBlueprint.route('/timetable/working-hours', methods=['GET'])
def get_working_hours_endpoint():
    
    token = request.headers.get('Authorization')
    
    coach = get_coach(token)
    
    if not coach:
        return jsonify({'error': 'Invalid token'}), 400
    
    results = execute_working_hours_query(coach['coach_id'])
    
    return jsonify(results), 200
    