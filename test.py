from datetime import datetime

def date_to_epoch(date):
    return int(datetime.strptime(date, '%Y-%m-%d').timestamp())


print(date_to_epoch('2023-12-20'))