"""
create a function that takes in a dictionary in the form:
 
{
    DD/MM/YYYY: [{booking/event, booking/event}],
    DD/MM/YYYY: [{booking/event, booking/event}],
    DD/MM/YYYY: [{booking/event, booking/event}],
}

each of the objects will have a .start_time which is in epoch seconds and a .duration which is in minutes

it should then use this information to calculate how many overlaps each one has, and thus it's width on 
the timetable as well as the position of each one to prevent overlaps

"""

from datetime import datetime, timedelta

def epoch_to_datetime(epoch_time):
    return datetime.fromtimestamp(epoch_time)

def calculate_overlaps(slots):
    overlap_info = {}
    slot_id_counter = 0

    for date, slot_list in slots.items():
        slot_list.sort(key=lambda x: x['start_time'])
        
        
        for i in range(0, len(slot_list)):
            slot_list[i]['slot_id'] = slot_id_counter  # Assign a unique ID to each slot
            slot_id_counter += 1  # Increment the counter for the next slot

        for i in range(0, len(slot_list)):
            # Convert the start time and end time of the i-th slot to datetime objects
            start_time_i = epoch_to_datetime(slot_list[i]['start_time'])
            end_time_i = start_time_i + timedelta(minutes=slot_list[i]['duration'])

            for j in range(i + 1, len(slot_list)):
                # Convert the start time and end time of the j-th slot to datetime objects
                start_time_j = epoch_to_datetime(slot_list[j]['start_time'])
                end_time_j = start_time_j + timedelta(minutes=slot_list[j]['duration'])

                # Check if the i-th slot and the j-th slot overlap
                if start_time_i <= start_time_j < end_time_i or start_time_i < end_time_j <= end_time_i:
                    # If they overlap, add their IDs to each other's 'overlaps_with' set
                    overlap_info.setdefault(slot_list[i]['slot_id'], {'overlaps_with': set(), 'position': 0})
                    overlap_info.setdefault(slot_list[j]['slot_id'], {'overlaps_with': set(), 'position': 0})
                    overlap_info[slot_list[i]['slot_id']]['overlaps_with'].add(slot_list[j]['slot_id'])
                    overlap_info[slot_list[j]['slot_id']]['overlaps_with'].add(slot_list[i]['slot_id'])

     #Calculate the width of each slot based on the number of overlaps
    for slot_id, info in overlap_info.items():
        overlap_count = len(info['overlaps_with'])
        info['width'] = 100 / (overlap_count + 1) 

    # Assign a position to each slot
    for date, slot_list in slots.items():
        positions_taken = []
        for slot in slot_list:
            slot_id = slot['slot_id']

            if slot_id in overlap_info:
                width = overlap_info[slot_id]['width']

                # Find the first available position
                position = 0
                while position in positions_taken:
                    position += 1
                overlap_info[slot_id]['position'] = position * width
                positions_taken.append(position)
            else:
                slot['width'] = 100
                slot['position'] = 0

            # Update the width and position of the slot
            slot['width'] = overlap_info.get(slot_id, {}).get('width', 100)
            slot['position'] = overlap_info.get(slot_id, {}).get('position', 0)
            
    return slots



