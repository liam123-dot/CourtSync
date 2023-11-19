import { checkIfOverlaps } from './CheckForOverlap';

describe('checkIfOverlaps', () => {
  test('should return false when there are no timetable event objects for the suggested date', () => {
    const all = {};
    const suggestedStartTime = 1627893600; // Epoch time for 03-Aug-2021 10:00 AM
    const suggestedDuration = 60; // 1 hour

    const result = checkIfOverlaps({ suggestedStartTime, suggestedDuration, all });

    expect(result).toBe(false);
  });

  test('should return false when there are no overlaps', () => {
    const all = {
      '03-08-2021': [
        { minutesIntoDay: 540, duration: 60 }, // 09:00 AM - 10:00 AM
        { minutesIntoDay: 660, duration: 120 }, // 11:00 AM - 01:00 PM
      ],
    };
    const suggestedStartTime = 1627893600; // Epoch time for 03-Aug-2021 10:00 AM
    const suggestedDuration = 60; // 1 hour

    const result = checkIfOverlaps({ suggestedStartTime, suggestedDuration, all });

    expect(result).toBe(false);
  });

  test('should return true when there is an overlap', () => {
    const all = {
      '02-08-2021': [
        { minutesIntoDay: 540, duration: 60 }, // 09:00 AM - 10:00 AM
        { minutesIntoDay: 660, duration: 120 }, // 11:00 AM - 01:00 PM
      ],
    };
    const suggestedStartTime = 1627893600; // Epoch time for 03-Aug-2021 10:00 AM
    const suggestedDuration = 120; // 2 hours

    const result = checkIfOverlaps({ suggestedStartTime, suggestedDuration, all });

    expect(result).toBe(true);
  });
});