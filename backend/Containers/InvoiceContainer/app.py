from flask import Flask
from flask_cors import CORS
import stripe
import time

from src.GetInvoices import invoices

app = Flask(__name__)
app.register_blueprint(invoices)
CORS(app)