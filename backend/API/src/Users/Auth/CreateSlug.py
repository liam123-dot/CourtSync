from flask import current_app

def insert_into_table(coach_id, first_name, last_name, email, phone_number):
    connection = current_app.config['db_connection'].connection
    
    phone_number = convert_phone_number(phone_number)
    
    coach_slug = find_valid_slug(first_name, last_name, connection)
    sql = "INSERT INTO Coaches(coach_id, slug, first_name, last_name, name, email, phone_number) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    with connection.cursor() as cursor:
        cursor.execute(sql, (coach_id, coach_slug, first_name, last_name, f"{first_name} {last_name}", email, phone_number))
    connection.commit()


def find_valid_slug(first_name, last_name, connection):
    counter = 0
    while True:
        if counter == 0:
            slug = f"{first_name}-{last_name}"
        else:
            slug = f"{first_name}-{last_name}-{counter}"
        slug_valid = check_slug_valid(slug, connection)
        if slug_valid:
            return slug
        else:
            counter += 1
            continue


def check_slug_valid(slug, connection):
    query = "SELECT * FROM Coaches WHERE slug=%s"
    with connection.cursor() as cursor:
        cursor.execute(query, (slug, ))
        response = cursor.fetchall()
    return len(response) == 0

def convert_phone_number(phone_number):
    # If the phone number is already 11 digits long, return it as is
    if len(phone_number) == 11:
        return phone_number

    # Check if the phone number starts with '+44' and is 13 digits long
    elif phone_number.startswith('+44') and len(phone_number) == 13:
        return '0' + phone_number[3:]

    else:
        return 'Invalid phone number'