import re

def is_phone_number_valid(phone_number):
    pattern = r'^(\+44\d{10}|0\d{10})$'
    return bool(re.match(pattern, phone_number))


def is_email_valid(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$'
    return re.match(pattern, email)