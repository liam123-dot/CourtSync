from Database import DBConfig
import time
import os
import boto3
import json
from datetime import datetime, timedelta
import calendar
from datetime import datetime

client = boto3.client('sqs')
#
def lambda_handler(event, context):
    
    print(event)
    
    QUEUE_URL = os.environ['QUEUE_URL']
    
    invoice_type = event.get('view', None)
    
    if not invoice_type:
        return {
            'statusCode': 400,
            'body': json.dumps('No view specified')
        }

    day_times = get_times(invoice_type)
    
    # pymysql connection
    DB = DBConfig()
    connection = DB.get_db_connection()
    with connection.cursor() as cursor:
        coaches = get_coaches(cursor, invoice_type)
        
        for coach in coaches:
            unsent_invoices = get_coach_unsent_invoices(cursor, coach[0], day_times)
            response = client.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps({'bookings': unsent_invoices, 'coach_id': coach[0], 'stripe_account': coach[1], 'coach_name': coach[2]}),
            )
            print(response)
            
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }            
    
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
        
def get_coaches(cursor, invoice_type): 
    sql = """
        SELECT coach_id, stripe_account, name, invoice_type FROM Coaches WHERE invoice_type=%s
    """
    cursor.execute(sql, (invoice_type, ))
    coaches = cursor.fetchall()
    
    return coaches

def get_coach_unsent_invoices(cursor, coach_id, day_times):
    sql = """
        SELECT booking_id, player_name, contact_name, contact_email, contact_phone_number, start_time, duration, cost, extra_costs
        FROM Bookings WHERE 
        coach_id=%s AND invoice_sent=0 AND start_time>=%s AND start_time<=%s AND status!='cancelled' AND paid=0
    """
    cursor.execute(sql, (coach_id, day_times[0], day_times[1]))
    
    results = cursor.fetchall()
    unsent_invoices = {}
    for result in results:
        contact_email = result[3]
        if contact_email not in unsent_invoices.keys():
            unsent_invoices[contact_email] = {}
            contact_name = result[2]
            contact_phone_number = result[4]
            unsent_invoices[contact_email]['contact_name'] = contact_name
            unsent_invoices[contact_email]['contact_phone_number'] = contact_phone_number
            
            unsent_invoices[contact_email]['bookings'] = []
            
        unsent_invoices[contact_email]['bookings'].append({
            "booking_id": result[0],
            "player_name": result[1],
            "contact_name": result[2],
            "start_time": result[5],
            "duration": result[6],
            "cost": result[7],
            "extra_costs": result[8]
        })
        
    return unsent_invoices
