from flask import Blueprint, request, jsonify, make_response
from ics import Calendar, Event
from datetime import datetime, timedelta

from src.Bookings.GetBookings.GetBookings import get_bookings
from src.Users.GetSelf.GetSelf import get_coach_from_slug

CreateICSCalendarBlueprint = Blueprint('CreateICSCalendar', __name__)

@CreateICSCalendarBlueprint.route('/timetable/<slug>/apple-calendar', methods=['GET'])
def create_ics(slug):
    coach = get_coach_from_slug(slug)

    # Get confirmed bookings for the coach
    bookings = get_bookings(coach['coach_id'], status='confirmed')

    # Create a calendar
    cal = Calendar()

    # Add events to the calendar
    for booking in bookings:
        event = Event()
        event.name = booking['player_name']
        start_time = datetime.utcfromtimestamp(booking['start_time'])
        event.begin = start_time
        event.end = start_time + timedelta(seconds=booking['duration'])
        cal.events.add(event)

    # Convert the calendar to a string
    calendar_str = str(cal)

    # Create a response
    response = make_response(calendar_str)
    response.headers['Content-Disposition'] = 'attachment; filename=calendar.ics'
    response.headers['Content-Type'] = 'text/calendar'
    return response
