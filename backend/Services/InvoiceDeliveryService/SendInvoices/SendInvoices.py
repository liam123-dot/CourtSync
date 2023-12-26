import stripe
import os
import json
import time
from datetime import datetime

from Database import DBConfig

def lambda_handler(event, context):
    
    stripe_secret_key = os.environ['STRIPE_SECRET_KEY']
    stripe.api_key = stripe_secret_key
    
    DB = DBConfig()
    connection = DB.get_db_connection()
    with connection.cursor() as cursor:
        print(event)
        for record in event['Records']:
            data = json.loads(record['body'])
            print(data)
            coach = {
                'coach_id': data['coach_id'],
                'coach_name': data['name'],
                'stripe_account': data['stripe_account']
            }
            
            for contact_email in data['contacts'].keys():
                contact = data['contacts'][contact_email]
                contact = {
                    'contact_name': contact['contact_name'],
                    'contact_email': contact_email,
                    'contact_phone_number': contact['contact_phone_number'],
                    'contact_id': contact['contact_id']
                }
                create_invoice(cursor, coach, contact, data['contacts'][contact_email]['bookings'])
            
                
    # connection.commit()
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
    
def create_invoice(cursor, coach, contact, bookings):
    customer_id = get_customer_id(cursor, coach, contact)
    
    invoice = stripe.Invoice.create(
        stripe_account=coach['stripe_account'],
        collection_method='send_invoice',
        payment_settings={"payment_method_types": ["customer_balance"]},
        customer=customer_id,
        days_until_due=7
    )
    
    amount_due =0
    
    booking_ids = {}
    
    items = False
    
    for booking in bookings:
        
        if check_booking_sent(cursor, booking['booking_id']):
            continue
        items = True
        
        start_time = datetime.fromtimestamp(booking['start_time']).strftime('%d/%m at %H:%M')
        description = f"Private lesson for {booking['player_name']} with {coach['coach_name']} on {start_time} for {booking['duration']} minutes."
        
        if booking['extra_costs'] > 0:
            extra_costs = "{:.2f}".format(booking['extra_costs'] / 100)
            description += f" Including Court Fee of £{extra_costs}"
            
        cost = booking['cost'] + booking['extra_costs']
        amount_due += cost
        
        price = stripe.Price.create(
                unit_amount=cost,
                currency="gbp",
                product_data={
                    'name': description
                },
                stripe_account=coach['stripe_account']
            )
        
        line_item = stripe.InvoiceItem.create(
            customer=customer_id,
            invoice=invoice,
            price=price,
            stripe_account=coach['stripe_account']
        )
        booking_ids[booking['booking_id']] = line_item['id']
        
    if items:
        stripe.Invoice.send_invoice(
            invoice,
            stripe_account=coach['stripe_account']
        )
        
        for booking_id in booking_ids.keys():
            mark_invoices_sent(cursor, booking_id, invoice['id'])

def get_customer_id(cursor, coach, contact):
    sql = "SELECT stripe_customer_id FROM Contacts WHERE contact_id=%s"

    cursor.execute(sql, (contact['contact_id'], ))

    result = cursor.fetchone()
    
    stripe_customer_id = result[0] if result else None
    
    if not stripe_customer_id:
        customer = stripe.Customer.create(
            stripe_account=coach['stripe_account'],
            email=contact['contact_email'],
            name=contact['contact_name'],
            phone=contact['contact_phone_number']
        )
        
        stripe_customer_id = customer['id']
        
        insert_customer_id(cursor, contact, stripe_customer_id)
        
    return stripe_customer_id

def insert_customer_id(cursor, contact, customer_id):

    sql = "UPDATE Contacts SET stripe_customer_id=%s WHERE contact_id=%s"
    cursor.execute(sql, (customer_id, contact['contact_id']))
    
    
def mark_invoices_sent(cursor, booking_id, invoice_id):

    sql = "UPDATE Bookings SET invoice_sent=1, invoice_id=%s WHERE booking_id=%s"
    cursor.execute(sql, (invoice_id, booking_id))
    
def check_booking_sent(cursor, booking_id):
    sql = "SELECT invoice_sent FROM Bookings WHERE booking_id=%s"
    cursor.execute(sql, (booking_id))
    try:
        invoice_sent = cursor.fetchone()[0] == b'\x01'
    except:
        invoice_sent = None
        
    return invoice_sent