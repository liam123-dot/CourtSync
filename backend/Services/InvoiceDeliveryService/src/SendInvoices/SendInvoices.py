import stripe
import os
import json
from Database import DBConfig
import time
from datetime import datetime

def lambda_handler(event, context):
    
    stripe_secret_key = os.environ['STRIPE_SECRET_KEY']
    stripe.api_key = stripe_secret_key
    
    DB = DBConfig()
    connection = DB.get_db_connection()
    with connection.cursor() as cursor:
        print(event)
        for record in event['Records']:
            data = json.loads(record['body'])
            stripe_account = data['stripe_account']
            coach_name = data['coach_name']
            for contact_email in data['bookings'].keys():
                contact_name = data['bookings'][contact_email]['contact_name']
                contact_phone_number = data['bookings'][contact_email]['contact_phone_number']
                create_invoice(stripe_account, contact_name, contact_email, contact_phone_number, data['bookings'][contact_email]['bookings'], cursor, coach_name)
                
    connection.commit()
    
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
                
        
def create_invoice(stripe_account, contact_name, contact_email, contact_phone_number, data, cursor, coach_name,week=None, month=None):

    # will take the customer bookings as a list of bookings with prices
    
    customer_id = get_customer_id(cursor, contact_email)

    if customer_id:
        customer = stripe.Customer.retrieve(
            customer_id,
            stripe_account=stripe_account
        )
    else:
        customer = stripe.Customer.create(
            stripe_account=stripe_account,
            email=contact_email,
            name=contact_name,
            phone=contact_phone_number
        )
        insert_customer_id(cursor, contact_name, contact_email, contact_phone_number, customer['id'])
        
    invoice = stripe.Invoice.create(
        stripe_account=stripe_account,
        collection_method='send_invoice',
        payment_settings={"payment_method_types": ["customer_balance"]},
        customer=customer,
        due_date=int(time.time()) + 60*60*24
    )
    amount_due = 0
    
    booking_ids = {}
    
    for booking in data:        
        
        start_time = datetime.fromtimestamp(booking['start_time']).strftime('%d/%m at %H:%M')
        description = f"Private lesson for {booking['player_name']} with {coach_name} on {start_time} for {booking['duration']} minutes."
        
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
                stripe_account=stripe_account
            )
        
        line_item = stripe.InvoiceItem.create(
            customer=customer,
            invoice=invoice,
            price=price,
            stripe_account=stripe_account
        )
        booking_ids[booking['booking_id']] = line_item['id']
            
    stripe.Invoice.send_invoice(
        invoice,
        stripe_account=stripe_account
    )
    
    DB = DBConfig()
    connection = DB.get_db_connection()
    with connection.cursor() as cursor:
        for booking_id in booking_ids.keys():
            mark_invoices_sent(cursor, booking_id, booking_ids[booking_id])
            
    connection.commit()

    

def get_customer_id(cursor, email):
    sql = "SELECT stripe_customer_id FROM Contacts WHERE contact_email=%s"

    cursor.execute(sql, (email))
    try:
        customer_id = cursor.fetchone()[0]
    except:
        customer_id = None
        
    return customer_id

def insert_customer_id(cursor, contact_name, contact_email, contact_phone_number, customer_id):
    sql = "INSERT INTO Contacts (contact_name, contact_email, contact_phone_number, stripe_customer_id) VALUES (%s, %s, %s, %s)"
    cursor.execute(sql, (contact_name, contact_email, contact_phone_number, customer_id))
    
    
def mark_invoices_sent(cursor, booking_id, line_item_id):

    sql = "UPDATE Bookings SET invoice_sent=1, line_item_id=%s WHERE booking_id=%s"
    cursor.execute(sql, (line_item_id, booking_id))
    
