from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
import asyncio
from src.shared.CheckAuthorization import get_access_token_username
from src.Timetable.GetTimetable.CalculateOverlaps import calculate_overlaps, reconstructe_bookings_and_events
from src.shared.ExecuteQuery import execute_query
from src.Timetable.GetTimetable.GetTimetableHelpers import epoch_to_date, calculate_indexes_to_dates

logging.basicConfig(level=logging.DEBUG)

GetTimetable = Blueprint('GetTimetable', __name__)

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
        date = epoch_to_date(booking[5])
        if date not in bookings.keys():
            bookings[date] = []
        new_booking = construct_new_booking(booking, authorised)
        bookings[date].append(new_booking)
        
    return bookings

def construct_new_booking(booking, authorised):
    if authorised:
        new_booking = {
            'booking_id': booking[0],
            'player_name': booking[1],
            'contact_name': booking[2],
            'contact_email': booking[3],
            'contact_phone_number': booking[4],
            'start_time': booking[5],
            'status': booking[6],
            'duration': booking[7],
            'cost': booking[8],
            'paid': booking[9]
        }
    else:
        new_booking = {
            'start_time': booking[5],
            'status': booking[6],
            'duration': booking[7],
            'booking_id': True
        }
    return new_booking
        
def get_bookings(coach_id, from_time, to_time, authorised):
    sql = construct_sql_query_bookings(authorised)
    try:
        results = execute_query(sql, (coach_id, from_time, to_time))
    except Exception as e:
        return None
    bookings = process_results_bookings(results, authorised)
    return bookings

# ----- GET COACH EVENTS -----

def construct_sql_coach_events(authorised):
    if authorised:
        sql = "SELECT event_id, start_time, duration, title, description FROM CoachEvents WHERE coach_id=%s AND %s < start_time AND start_time < %s"
    else:
        sql = "SELECT start_time, duration FROM CoachEvents WHERE coach_id=%s AND %s < start_time AND start_time < %s "
    return sql

def construct_new_coach_event(coach_event, authorised):
    if authorised:
        new_coach_event = {
            'event_id': coach_event[0],
            'start_time': coach_event[1],
            'duration': coach_event[2],
            'title': coach_event[3],
            'description': coach_event[4]
        }
    else:
        new_coach_event = {
            'start_time': coach_event[0],
            'duration': coach_event[1]
        }
    return new_coach_event

def process_results_coach_events(results, authorised):
    coach_events = {}
    for coach_event in results:
        date = epoch_to_date(coach_event[1])
        if date not in coach_events.keys():
            coach_events[date] = []
        new_coach_event = construct_new_coach_event(coach_event, authorised)
        coach_events[date].append(new_coach_event)
    return coach_events

def get_coach_events(coach_id, from_time, to_time, authorised):
    sql = construct_sql_coach_events(authorised)
    try:
        results = execute_query(sql, (coach_id, from_time, to_time))
    except Exception as e:
        return None
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
        working_hour_id = result[0]
        day_of_week = result[1]
        start_time = result[2]
        end_time = result[3]
        if day_of_week in day_index_to_date.keys():
            day_index = day_index_to_date[day_of_week]
            working_hours[day_index] = {
                'working_hour_id': working_hour_id,
                'start_time': start_time,
                'end_time': end_time
            }
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
        working_hour_id = result[0]
        day_of_week = result[1]
        start_time = result[2]
        end_time = result[3]
        working_hours[day_of_week] = {
            'working_hour_id': working_hour_id,
            'start_time': start_time,
            'end_time': end_time
        }

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
        rule_id = result[0]
        hourly_rate = result[1]
        is_default = result[2]
        start_time = result[3]
        end_time = result[4]
        if start_time:
            date = epoch_to_date(start_time)
        else:
            date = 'default'
        if date not in pricing_rules.keys():
            pricing_rules[date] = []
                
        if date == 'default':
            pricing_rules['default'] = {
                'rule_id': rule_id,
                'hourly_rate': hourly_rate,
                'is_default': is_default,
                'start_time': start_time,
                'end_time': end_time
            }
            
        else:
            pricing_rules[date].append({
                'rule_id': rule_id,
                'hourly_rate': hourly_rate,
                'is_default': is_default,
                'start_time': start_time,
                'end_time': end_time                }
            )
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
    except Exception as e:
        return None

    durations = sorted([row[0] for row in results])
    return durations


# ----- GET TIMETABLE -----

@GetTimetable.route('/timetable/<slug>', methods=['GET'])
def get_timetable(slug):
    
    try:
        from_time = int(request.args.get('from_time'))
        to_time = int(request.args.get('to_time'))
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing query string parameter: {e}")
    except ValueError as e:
        return jsonify(message='Times must be valid integers'), 400
    
    token = request.headers.get('Authorization')
    
    username = None
    if token:
        valid, username = get_access_token_username(token)
        
    coach_id = get_coach_id(slug)
    
    authorised = False
    if username:
        if coach_id == username:
            authorised = True
        
    start_date = epoch_to_date(from_time)
    end_date = epoch_to_date(to_time)
    
    bookings = get_bookings(coach_id, from_time, to_time, authorised)
    coach_events = get_coach_events(coach_id, from_time, to_time, authorised)
    working_hours = get_working_hours(coach_id, start_date, end_date)
    default_working_hours = get_default_working_hours(coach_id)
    durations = get_durations(coach_id)
    pricing_rules = get_pricing_rules(coach_id)
    
    
    bookings, coach_events = process_overlaps(bookings, coach_events)
    
    return jsonify(
        authorised=authorised,
        bookings=bookings,
        coach_events=coach_events,
        default_working_hours=default_working_hours,
        durations=durations,
        exists=True,
        pricing_rules=pricing_rules,
        working_hours=working_hours
    ), 200


def get_coach_id(slug):
    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"

    try:
        coach_id = execute_query(sql, (slug,))[0][0]
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