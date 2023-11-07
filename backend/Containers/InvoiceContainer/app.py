from flask import Flask
from flask_cors import CORS
import stripe
import time

from src.InvoicePage import invoices

app = Flask(__name__)
app.register_blueprint(invoices)
CORS(app)

# stripe_test_key_secret= 'sk_test_51O9ZfgHr5w2HXr5R8PQcEotoZ5FacJdXCm4yrAjWwjiFI9MkOwnqQLi6P2BBwYlrO5IeOZ7LznSW1oOBFdrV1Fci002J5POU5f'
# stripe_test_key_public= 'pk_test_51O9ZfgHr5w2HXr5RZ2wNlEaC22CkcHUFE1l79dSSAIxP2jdRnjEK5gutKbtzcEljgzGwQCRHEgXNHREhLmf7Szyx00xoO4BHfq'

# stripe.api_key=stripe_test_key_secret

# def create_invoice(customer_bookings):

#     # will take the customer bookings as a list of bookings with prices

#     customer = stripe.Customer.create(
#         stripe_account='acct_1O9aN6EgO5x68YWF',
#         email='l.buchanan358@gmail.com'
#     )

#     invoice = stripe.Invoice.create(
#         stripe_account='acct_1O9aN6EgO5x68YWF',
#         collection_method='send_invoice',
#         payment_settings={"payment_method_types": ["customer_balance"]},
#         customer=customer,
#         due_date=int(time.time()) + 60*60*24
#     )

#     for booking in customer_bookings:

#         price = stripe.Price.create(
#                 unit_amount=booking['price'],
#                 currency="gbp",
#                 product_data={
#                     'name': 'Booking for {}'.format(booking.get('description', 'Unknown Service'))
#                 },
#                 stripe_account='acct_1O9aN6EgO5x68YWF'
#             )
        
#         line_item = stripe.InvoiceItem.create(
#             customer=customer,
#             invoice=invoice,
#             price=price,
#             stripe_account='acct_1O9aN6EgO5x68YWF'
#         )

# create_invoice([
#     {
#         'price': 2300
#     },
#     {
#         'price': 2500
#     },
#     {
#         'price': 2000
#     }
# ])