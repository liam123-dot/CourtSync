from flask import Blueprint, request, jsonify
from src.utils.CheckAuthorization import get_access_token_username
from src.utils.ExecuteQuery import execute_query
from src.Timetable.GetTimetable.GetTimetableHelpers import get_day_of_week, epoch_to_date, get_day_index_from_epoch, calculate_indexes_to_dates
GetTimetable = Blueprint('GetTimetable', __name__)


def get_bookings(coach_id, from_time, to_time, authorised):

    sql = "SELECT booking_id, player_name, contact_name, contact_email, contact_phone_number, start_time, status, duration, cost, paid FROM Bookings WHERE coach_id=%s AND %s < start_time AND start_time < %s"

    results = execute_query(sql, (coach_id, from_time, to_time))

    bookings = {}

    for booking in results:
        booking_id = booking[0]
        player_name = booking[1]
        contact_name = booking[2]
        contact_email = booking[3]
        contact_phone_number = booking[4]
        start_time = booking[5]
        status = booking[6]
        duration = booking[7]
        cost = booking[8]
        paid = booking[9]

        date = epoch_to_date(start_time)

        if date not in bookings.keys():
            bookings[date] = []

        new_booking = {}
        if authorised:
            new_booking = {
                'booking_id': booking_id,
                'player_name': player_name,
                'contact_name': contact_name,
                'contact_email': contact_email,
                'contact_phone_number': contact_phone_number,
                'start_time': start_time,
                'status': status,
                'duration': duration,
                'cost': cost,
                'paid': paid
            }
        else:
            new_booking = {
                'start_time': start_time,
                'status': status,
                'duration': duration
            }

        bookings[date].append(new_booking)

    return bookings


def get_working_hours(coach_id, start_date, end_date):

    day_index_to_date = calculate_indexes_to_dates(
        start_date=start_date,
        end_date=end_date
        )

    working_hours = {}

    sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s"
    results = execute_query(sql, (coach_id, ))

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


def get_default_working_hours(coach_id):
    working_hours = {}

    sql = "SELECT working_hour_id, day_of_week, start_time, end_time FROM WorkingHours WHERE coach_id=%s"
    results = execute_query(sql, (coach_id, ))

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

def get_pricing_rules(coach_id):

    pricing_rules = {}

    sql = "SELECT rule_id, hourly_rate, is_default, start_time, end_time FROM PricingRules WHERE coach_id=%s"

    results = execute_query(sql, (coach_id, ))

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
                'end_time': end_time,
                'day': day
                }
            )

    return pricing_rules


def get_durations(coach_id):
    sql = 'SELECT duration FROM Durations WHERE coach_id=%s'
    results = execute_query(sql, (coach_id, ))

    durations = sorted([row[0] for row in results])
    return durations


@GetTimetable.route('/timetable/<slug>', methods=['GET'])
def get_timetable(slug):
    
    try:
        from_time = int(request.args['from_time'])
        to_time = int(request.args['to_time'])
    except KeyError as e:
        return jsonify(message=f"Invalid/Missing query string parameter: {e}")
    except ValueError as e:
        return jsonify(message='Times must be valid integers'), 400
        
    token = request.headers.get('Authorization', None)
    
    username = None
    if token:
        valid, username = get_access_token_username(token)

    sql = "SELECT coach_id FROM Coaches WHERE slug=%s"
    try:
        coach_id = execute_query(sql, (slug, ))[0][0]
    except IndexError:
        return jsonify(message='Coach with passed slug does not exist'), 400

    authorised = False
    if username:
        if coach_id == username:
            authorised = True

    start_date = epoch_to_date(from_time)
    end_date = epoch_to_date(to_time)

    working_hours = get_working_hours(coach_id, start_date, end_date)
    default_working_hours = get_default_working_hours(coach_id)
    bookings = get_bookings(coach_id, from_time, to_time, authorised)
    pricing_rules = get_pricing_rules(coach_id)
    durations = get_durations(coach_id)

    return jsonify(
        working_hours=working_hours,
        default_working_hours=default_working_hours,
        pricing_rules=pricing_rules,
        durations=durations,
        bookings=bookings,
        authorised=authorised
    ), 200


