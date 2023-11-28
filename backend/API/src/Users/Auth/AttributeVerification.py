import re

def is_password_valid(password):
    pattern = (r'^(?=.*[a-z])'  # at least one lowercase character
               r'(?=.*[A-Z])'  # at least one uppercase character
               r'(?=.*\d)'  # at least one digit
               r'(?=.*[^\w\s])'  # at least one special character
               r'[A-Za-z\d\^\$\*\.\[\]\{\}\(\)\?"!@#%&/\\,><\':;\|_~`=+\-]{8,}$')  # at least 8 characters long

    return bool(re.match(pattern, password))


def is_phone_number_valid(phone_number):
    pattern = r'^(\+44\d{10}|0\d{10})$'
    return bool(re.match(pattern, phone_number))


def is_email_valid(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@(?:(?!-)[A-Za-z0-9-]{1,63}(?<!-)\.)+[A-Za-z]{2,}$'
    return re.match(pattern, email)