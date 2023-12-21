from flask import request, jsonify, Blueprint

from src.Users.GetSelf.GetSelf import get_coach

CancelInvoiceBlueprint = Blueprint('CancelInvoiceBlueprint', __name__)


