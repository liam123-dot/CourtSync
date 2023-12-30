from flask import request, jsonify, Blueprint
from datetime import datetime

import json

from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach_from_slug

def get_bookings(coach):
    sql = """SELECT Bookings.*, DAYOFMONTH(FROM_UNIXTIME(start_time)) as day, MONTH(FROM_UNIXTIME(start_time)) as month, YEAR(FROM_UNIXTIME(start_time)) as year 
        FROM Bookings WHERE coach_id = %s AND start_time < (UNIX_TIMESTAMP() + %s) and start_time > UNIX_TIMESTAMP() AND status='confirmed'"""

    args = [coach['coach_id'], coach['booking_scope'] * 86400]
    
    response = execute_query(sql, args)    
    
    return response    

def get_coach_events(coach):
    sql = """SELECT CoachEvents.*, DAYOFMONTH(FROM_UNIXTIME(start_time)) as day, MONTH(FROM_UNIXTIME(start_time)) as month, YEAR(FROM_UNIXTIME(start_time)) as year
        FROM CoachEvents WHERE coach_id = %s AND start_time < (UNIX_TIMESTAMP() + %s) and start_time > UNIX_TIMESTAMP() and status='confirmed'"""
        
    args = [coach['coach_id'], coach['booking_scope'] * 86400]
    
    response = execute_query(sql, args)
    
    return response

def get_coach_durations(coach):
    sql = "SELECT duration FROM Durations WHERE coach_id = %s"
    
    response = execute_query(sql, (coach['coach_id'], ))
    
    return response

def check_days_from_coach(coach):
    
    bookings = get_bookings(coach)
    coach_events = get_coach_events(coach)
    working_hours = get_working_hours(coach)
    
    working_hours = format_working_hours(working_hours)
    
    return bookings, coach_events, working_hours

def organize_events_by_date(events, working_hours, dates):
    events_by_date = {}
    for event in events:
        # Format date_key with zero-padding
        date_key = f"{event['year']:04d}-{event['month']:02d}-{event['day']:02d}"
        
        if date_key not in events_by_date:
            events_by_date[date_key] = []
        
        event_details = {
            'start_time': event['start_time'],
            'duration': event['duration']
        }
        
        events_by_date[date_key].append(event_details)     

    for date in dates:
        if date not in events_by_date:
            events_by_date[date] = []
        
        event_date = datetime.strptime(date, "%Y-%m-%d")
        weekday = event_date.weekday()
        
        working_hour = working_hours[weekday]
        
        formatted_working_hour = get_formatted_working_hour_for_date(event_date, working_hour)
        
        events_by_date[date].extend(formatted_working_hour)
        
    return events_by_date


def get_formatted_working_hour_for_date(date, working_hour):
    # get the epoch time for the date object
    
    epoch_time = date.timestamp()
    
    returner = []
    
    returner.append({
        'start_time': epoch_time,
        'duration': working_hour['start_time']
    })
    returner.append({
        'start_time': epoch_time + (working_hour['end_time'] * 60),
        'duration': 1440 - (working_hour['end_time'])
    })
    
    return returner

def get_working_hours(coach):
    
    sql = "SELECT * FROM WorkingHours WHERE coach_id = %s"
    
    results = execute_query(sql, (coach['coach_id'], ))
    
    for i in range(0, len(results)):
        working_hour = results[i]
        if working_hour['start_time'] is None or working_hour['end_time'] is None:
            working_hour['start_time'] = 0
            working_hour['end_time'] = 0            
    
    return results

def format_working_hours(working_hours):
    
    formatted_working_hours = {}
    
    for working_hour in working_hours:
        day = working_hour['day_of_week']
        formatted_working_hours[day] = working_hour
        
    return formatted_working_hours
    
def check_for_gaps(all_events, min_duration):
    gap_days = {}

    for date, events in all_events.items():
        # Sort events by start_time
        events.sort(key=lambda x: x['start_time'])

        # Check for gaps
        has_gap = False
        for i in range(len(events) - 1):
            end_of_current = events[i]['start_time'] + events[i]['duration'] * 60
            start_of_next = events[i + 1]['start_time']

            if (start_of_next - end_of_current) > min_duration * 60:
                has_gap = True
                break

        gap_days[date] = has_gap

    return gap_days


CheckDaysBlueprint = Blueprint("CheckDaysBlueprint", __name__)

@CheckDaysBlueprint.route("/timetable/<slug>/check-days", methods=["GET"])
def check_days(slug):
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({"error": "Coach not found"}), 404
    
    bookings, coach_events, working_hours = check_days_from_coach(coach)
    
    dates = calculate_dates(coach)
    
    all_events = organize_events_by_date(bookings + coach_events, working_hours, dates)
    
    coach_durations = get_coach_durations(coach)
    
    coach_durations_sorted = sorted(coach_durations, key=lambda x: x['duration'])
    
    results = check_for_gaps(all_events, coach_durations_sorted[0]['duration'])
    
    return jsonify(        
        results=results
    ), 200

def calculate_dates(coach):
    
    now = datetime.now()
    booking_scope_weeks = coach['booking_scope']
    booking_scope_epoch = booking_scope_weeks * 7 * 24 * 60 * 60
    
    min_time = now.timestamp()
    
    max_time = now.timestamp() + booking_scope_epoch
    
    # return each day in yyyy-mm-dd format between min_time and max_time
    
    returner = []
    
    while min_time < max_time:
        date = datetime.fromtimestamp(min_time)
        returner.append(date.strftime("%Y-%m-%d"))
        min_time += 86400
        
    return returner
    
