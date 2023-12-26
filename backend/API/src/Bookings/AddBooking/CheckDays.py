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

def check_days_from_coach(coach):
    
    bookings = get_bookings(coach)
    coach_events = get_coach_events(coach)
    working_hours = get_working_hours(coach)
    
    working_hours = format_working_hours(working_hours)
    
    return bookings, coach_events, working_hours

def organize_events_by_date(events, working_hours):
    events_by_date = {}
    for event in events:
        date_key = f"{event['year']}-{event['month']}-{event['day']}"
        
        if date_key not in events_by_date:
            events_by_date[date_key] = []
            
            event_date = datetime(event['year'], event['month'], event['day'])
            # Get the weekday number (0 for Monday, 6 for Sunday)
            day_number = event_date.weekday()
                            
            working_hour = working_hours[day_number]
            formatted_working_hour = get_formatted_working_hour_for_date(event_date, working_hour)
            
            events_by_date[date_key].extend(formatted_working_hour)
        
        event_details = {
            'start_time': event['start_time'],
            'duration': event['duration']
        }
        
        events_by_date[date_key].append(event_details)
        
        
    
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
    

CheckDaysBlueprint = Blueprint("CheckDaysBlueprint", __name__)

@CheckDaysBlueprint.route("/bookings/<slug>/check-days", methods=["GET"])
def check_days(slug):
    coach = get_coach_from_slug(slug)
    
    if not coach:
        return jsonify({"error": "Coach not found"}), 404
    
    bookings, coach_events, working_hours = check_days_from_coach(coach)
    
    all_events = organize_events_by_date(bookings + coach_events, working_hours)
    
    return jsonify(
        all_events=all_events,
        working_hours=working_hours
    ), 200
