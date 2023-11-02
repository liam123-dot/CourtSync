

epoch_time_1 = 1699432200
epoch_time_2 = 1698950653


from datetime import datetime

def get_day_of_week_from_epoch(epoch_time):
    # Convert the epoch time to a datetime object
    dt = datetime.utcfromtimestamp(epoch_time)
    print(dt)
    # Calculate the day of the week (with Monday as 0 and Sunday as 6)
    return dt.weekday()