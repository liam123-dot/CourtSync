from src.shared.ExecuteQuery import execute_query

def insert_into_table(coach_id, first_name, last_name, email):
    coach_slug = find_valid_slug(first_name, last_name)
    sql = "INSERT INTO Coaches(coach_id, slug, email) VALUES (%s, %s, %s)"
    execute_query(sql, (coach_id, coach_slug, email))


def find_valid_slug(first_name, last_name):
    counter = 0
    while True:
        if counter == 0:
            slug = f"{first_name}-{last_name}"
        else:
            slug = f"{first_name}-{last_name}-{counter}"
        slug_valid = check_slug_valid(slug)
        if slug_valid:
            return slug
        else:
            counter += 1
            continue


def check_slug_valid(slug):
    query = "SELECT * FROM Coaches WHERE slug=%s"
    response = execute_query(query, (slug, ))
    return len(response) == 0
