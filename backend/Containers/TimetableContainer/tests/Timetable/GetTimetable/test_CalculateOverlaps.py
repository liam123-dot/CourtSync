import unittest
from src.Timetable.GetTimetable.CalculateOverlaps import calculate_overlaps, reconstructe_bookings_and_events

class TestCalculateOverlaps(unittest.TestCase):
    
    
    
    def test_no_overlap(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 60},  # 01 Jan 2022 00:00:00 GMT
                {'start_time': 1641056400, 'duration': 60},  # 01 Jan 2022 01:00:00 GMT
            ]
        }
        result = calculate_overlaps(slots)
        self.assertEqual(result['2022-01-01'][0]['width'], 100)
        self.assertEqual(result['2022-01-01'][0]['position'], 0)
        self.assertEqual(result['2022-01-01'][1]['width'], 100)
        self.assertEqual(result['2022-01-01'][1]['position'], 0)

    def test_overlap(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 120},  # 01 Jan 2022 00:00:00 GMT
                {'start_time': 1641056400, 'duration': 60},  # 01 Jan 2022 01:00:00 GMT
            ]
        }
        result = calculate_overlaps(slots)
        self.assertEqual(result['2022-01-01'][0]['width'], 50)
        self.assertEqual(result['2022-01-01'][0]['position'], 0)
        self.assertEqual(result['2022-01-01'][1]['width'], 50)
        self.assertEqual(result['2022-01-01'][1]['position'], 50)
        
    def test_no_slots(self):
        slots = {}
        result = calculate_overlaps(slots)
        self.assertEqual(result, {})

    def test_single_slot(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 60},  # 01 Jan 2022 00:00:00 GMT
            ]
        }
        result = calculate_overlaps(slots)
        self.assertEqual(result['2022-01-01'][0]['width'], 100)
        self.assertEqual(result['2022-01-01'][0]['position'], 0)

    def test_all_slots_overlap(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 120},  # 01 Jan 2022 00:00:00 GMT
                {'start_time': 1641052800, 'duration': 120},  # 01 Jan 2022 00:00:00 GMT
            ]
        }
        result = calculate_overlaps(slots)
        self.assertEqual(result['2022-01-01'][0]['width'], 50)
        self.assertEqual(result['2022-01-01'][0]['position'], 0)
        self.assertEqual(result['2022-01-01'][1]['width'], 50)
        self.assertEqual(result['2022-01-01'][1]['position'], 50)
        
    def test_two_overlaps(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 180},  # 01 Jan 2022 00:00:00 GMT
                {'start_time': 1641056400, 'duration': 60},  # 01 Jan 2022 01:00:00 GMT
                {'start_time': 1641058200, 'duration': 60},  # 01 Jan 2022 01:30:00 GMT
            ]
        }
        result = calculate_overlaps(slots)
        self.assertEqual(result['2022-01-01'][0]['width'], 100/3)
        self.assertEqual(result['2022-01-01'][0]['position'], 0)
        self.assertEqual(result['2022-01-01'][1]['width'], 100/3)
        self.assertEqual(result['2022-01-01'][1]['position'], 100/3)
        self.assertEqual(result['2022-01-01'][2]['width'], 100/3)
        self.assertEqual(result['2022-01-01'][2]['position'], 200/3)

    def test_three_overlaps(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 240},  # 01 Jan 2022 00:00:00 GMT
                {'start_time': 1641056400, 'duration': 120},  # 01 Jan 2022 01:00:00 GMT
                {'start_time': 1641058200, 'duration': 120},  # 01 Jan 2022 01:30:00 GMT
                {'start_time': 1641060000, 'duration': 60},  # 01 Jan 2022 02:00:00 GMT
            ]
        }
        result = calculate_overlaps(slots)
        self.assertEqual(result['2022-01-01'][0]['width'], 25)
        self.assertEqual(result['2022-01-01'][0]['position'], 0)
        self.assertEqual(result['2022-01-01'][1]['width'], 25)
        self.assertEqual(result['2022-01-01'][1]['position'], 25)
        self.assertEqual(result['2022-01-01'][2]['width'], 25)
        self.assertEqual(result['2022-01-01'][2]['position'], 50)
        self.assertEqual(result['2022-01-01'][3]['width'], 25)
        self.assertEqual(result['2022-01-01'][3]['position'], 75)


    def test_reconstruct(self):
        slots = {
            '2022-01-01': [
                {'start_time': 1641052800, 'duration': 240, 'booking_id': 1},  # 01 Jan 2022 00:00:00 GMT
                {'start_time': 1641056400, 'duration': 120},  # 01 Jan 2022 01:00:00 GMT
                {'start_time': 1641058200, 'duration': 120, 'booking_id': 2},  # 01 Jan 2022 01:30:00 GMT
                {'start_time': 1641060000, 'duration': 60},  # 01 Jan 2022 02:00:00 GMT
            ]
        }
        
        bookings, events = reconstructe_bookings_and_events(slots)
        
        self.assertEqual(bookings, {'2022-01-01': [{'start_time': 1641052800, 'duration': 240, 'booking_id': 1}, {'start_time': 1641058200, 'duration': 120, 'booking_id': 2}]})
        self.assertEqual(events, {'2022-01-01': [{'start_time': 1641056400, 'duration': 120}, {'start_time': 1641060000, 'duration': 60}]})


if __name__ == '__main__':
    unittest.main()