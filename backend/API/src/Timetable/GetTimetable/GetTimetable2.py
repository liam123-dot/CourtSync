from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

from src.Bookings.GetBookings.GetBookings import get_bookings
from src.CoachEvents.GetCoachEvents import get_coach_events
from src.Database.ExecuteQuery import execute_query
from src.Users.GetSelf.GetSelf import get_coach

GetTimetable2Blueprint = Blueprint('GetTimetable2Blueprint', __name__)

def format_bookings(bookings):
    for booking in bookings:
        start_time = datetime.fromtimestamp(booking['start_time'])
        booking['start'] = start_time.strftime('%Y-%m-%dT%H:%M:%SZ')
        end_time = start_time + timedelta(minutes=booking['duration'])
        booking['end'] = end_time.strftime('%Y-%m-%dT%H:%M:%SZ')
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
