from flask import Flask, request, jsonify
from flask_cors import CORS
from src.Routes.UserGetSelf import UserGetSelfBlueprint
from src.Routes.AddStripeAccount import AddStripeAccountBlueprint
from src.Routes.EditUserAttribute import EditUserAttributeBlueprint

app = Flask(__name__)
app.register_blueprint(UserGetSelfBlueprint)
app.register_blueprint(AddStripeAccountBlueprint)
app.register_blueprint(EditUserAttributeBlueprint)
CORS(app)