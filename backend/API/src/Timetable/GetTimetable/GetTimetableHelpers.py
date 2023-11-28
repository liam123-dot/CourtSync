from datetime import datetime, timedelta

def get_day_of_week(date_str):
    # Convert the date string to a datetime object
    dt = datetime.strptime(date_str, '%d-%m-%Y')
    
    # Get the name of the day of the week
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    return days[dt.weekday()]

def epoch_to_date(epoch_time):
    # Convert the epoch time to a datetime object
    dt = datetime.fromtimestamp(epoch_time)
    
    # Format the datetime object to a string in the desired format
    return dt.strftime('%d-%m-%Y')

def get_day_index_from_epoch(epoch_time):
    # Convert the epoch time to a datetime object
    dt = datetime.fromtimestamp(epoch_time)
    
    # Return the index of the day of the week
    return dt.weekday()

def calculate_indexes_to_dates(start_date, end_date):
    # Convert the date strings to datetime objects
    start_dt = datetime.strptime(start_date, '%d-%m-%Y')
    end_dt = datetime.strptime(end_date, '%d-%m-%Y')
    
    # Initialize the result dictionary
    result = {}

    # Loop through the dates from start to end
    while start_dt <= end_dt:
        day_index = start_dt.weekday()
        formatted_date = start_dt.strftime('%d-%m-%Y')
        result[day_index] = formatted_date

        # Move to the next day
        start_dt += timedelta(days=1)

    return result