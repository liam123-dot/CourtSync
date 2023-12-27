import time
import os
import boto3
import json
from datetime import datetime, timedelta
import calendar

from Database import DBConfig

client = boto3.client('sqs')

def lambda_handler(event, context):
    DB = DBConfig()
    connection = DB.get_db_connection()

    QUEUE_URL = os.environ['QUEUE_URL']
    
    invoice_type = event.get('view', None)

    if not invoice_type:
        return {
            'statusCode': 400,
            'body': json.dumps('No view specified')
        }
    
    with connection.cursor() as cursor:
        coaches, coaches_dict = get_coaches(cursor, invoice_type)
        coach_ids = [coach['coach_id'] for coach in coaches]
        
        bookings = get_bookings(cursor, invoice_type, coach_ids)
        
        coaches = {}
        
        for booking in bookings:
            if booking['coach_id'] not in coaches:
                coach_id = booking['coach_id']
                coaches[coach_id] = {
                    'coach_id': coach_id,
                    'stripe_account': coaches_dict[coach_id]['stripe_account'],
                    'name': coaches_dict[coach_id]['name'],
                    'contacts': {}
                }
            
            if booking['contact_email'] not in coaches[booking['coach_id']]['contacts']:
                coaches[booking['coach_id']]['contacts'][booking['contact_email']] = {
                    'contact_id': booking['contact_id'],
                    'contact_name': booking['contact_name'],
                    'contact_phone_number': booking['contact_phone_number'],
                    'bookings': []
                }
            
            coaches[booking['coach_id']]['contacts'][booking['contact_email']]['bookings'].append({
                'booking_id': booking['booking_id'],
                'start_time': booking['start_time'],
                'duration': booking['duration'],
                'player_name': booking['player_name'],
                'cost': booking['cost'],
                'extra_costs': booking['extra_costs']
            })
            
        for coach_id, coach in coaches.items():
            print(coach_id)
            print(coach)
            response = client.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps(coach),
            )
            
            print(response)

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'success'
        })
    }
    
def format_bookings(bookings):
    contacts = {}
    
    for booking in bookings:
        if booking['contact_email'] not in contacts:
            contacts[booking['contact_email']] = {
                'contact_id': booking['contact_id'],
                'contact_name': booking['contact_name'],
                'contact_phone_number': booking['contact_phone_number'],
                'bookings': []
            }
            
        contacts[booking['contact_email']]['bookings'].append({
            'booking_id': booking['booking_id'],
            'start_time': booking['start_time'],
            'duration': booking['duration'],
            'player_name': booking['player_name'],
            'cost': booking['cost'],
            'extra_costs': booking['extra_costs']
        })
        
    return contacts

def get_coaches(cursor, invoice_type):
    sql = "SELECT coach_id, stripe_account, name FROM Coaches WHERE invoice_type=%s AND stripe_account IS NOT NULL"
    cursor.execute(sql, (invoice_type,))
    result = cursor.fetchall()
    
    coaches = []
    coaches_dict = {}
    
    for coach in result:
        coaches.append({
            'coach_id': coach[0],
            'stripe_account': coach[1],
            'name': coach[2]
        })
        coaches_dict[coach[0]] = {
            'coach_id': coach[0],
            'stripe_account': coach[1],
            'name': coach[2]
        }
    
    return coaches, coaches_dict

def get_bookings(cursor, invoice_type, coach_ids):
    sql = """
    SELECT Bookings.*, Contacts.name AS contact_name, Contacts.email as contact_email, Contacts.phone_number as contact_phone_number, Contacts.contact_id as contact_id, Players.name AS player_name, Contacts.invoice_type as invoice_type
    FROM Bookings
    INNER JOIN Contacts ON Bookings.contact_id = Contacts.contact_id
    INNER JOIN Players ON Bookings.player_id = Players.player_id
    WHERE Bookings.invoice_sent = 0
    AND Bookings.start_time < UNIX_TIMESTAMP()
    AND Bookings.paid = 0
    AND Bookings.invoice_cancelled = 0
    AND Bookings.status = 'confirmed'
    AND (Bookings.coach_id IN %s
    OR invoice_type=%s)
    """

    # Convert coach_ids list to a string for the SQL query    
    cursor.execute(sql, (coach_ids, invoice_type))
    
    column_names = [desc[0] for desc in cursor.description]
    result = cursor.fetchall()
    
    results = []
    
    for row in result:
        if row is not None:
            row_dict = dict(zip(column_names, row))
            for key, value in row_dict.items():
                if isinstance(value, bytes):
                    row_dict[key] = bool(int.from_bytes(value, byteorder='big'))
            results.append(row_dict)     
        
    return results
    
# function that gets the epoch time of the start and end of previous day
def get_times(view='daily'):
    date = datetime.now()
    
    if view == 'daily':
        date = date.replace(day=date.day-1)
        start_of_day = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = date.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return (int(start_of_day.timestamp()), int(end_of_day.timestamp()))
    elif view == 'weekly':
        # Subtract the current day of the week from the date to get the last Monday
        start_of_week = date - timedelta(days=date.weekday(), weeks=1)
        # Add 6 to the start of the week to get the Sunday
        end_of_week = start_of_week + timedelta(days=6)
        
        start_of_week = start_of_week.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_week = end_of_week.replace(hour=23, minute=59, second=59, microsecond=999999)
        
        return (int(start_of_week.timestamp()), int(end_of_week.timestamp()))
    
    elif view == 'monthly':
        # Set the date to the first day of the previous month
        date = date.replace(day=1) - timedelta(days=1)
        start_of_month = date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # assuming you have a datetime object called `date` representing the current month
        last_day = calendar.monthrange(date.year, date.month)[1]
        last_day_of_month = datetime(date.year, date.month, last_day, 23, 59, 59, 999999)
        
        return (int(start_of_month.timestamp()), int(last_day_of_month.timestamp()))
    
    else:
        return None