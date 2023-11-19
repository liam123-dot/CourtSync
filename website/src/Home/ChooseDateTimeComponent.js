import react, {useEffect, useState} from 'react';
import { css } from "@emotion/react";
import styled from '@emotion/styled';
import { useParams } from 'react-router-dom';
import { WorkingHoursObject } from './Calendar/WorkingHoursObject';

const Label = styled.label`
  margin-right: 15px;
  display: block; // changed to block to display on new lines
  margin-top: 10px; 
`;

const InputField = styled.input`
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SelectField = styled.select`
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;


const dateToString = (date) => {
    if (date){
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
}
function formatDate(date) {
    let day = date.getDate().toString().padStart(2, '0');
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); // January is 0!
    let year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
}

export default function ChooseDateTimeComponent({fetchTimetableData, 
    durations, 
    all,
    selectedDate,
    setSelectedDate,
    startTime,
    setStartTime,
    duration,
    setDuration,
    loadedDates,
    }) {

    const {coachSlug} = useParams();

    const [isDateValid, setIsDateValid] = useState(true); // New state to track date validity
    const [availableStartTimes, setAvailableStartTimes] = useState({}); // New state to track available start times

    useEffect(() => {
        if (selectedDate){
            calculateAvailableStartTimes(selectedDate);
        }
    }, [all, selectedDate, loadedDates])

    const calculateStartAndEndTimes = (eventsOnDay) => {

        const start = 24 * 60; // 24 hours * 60 minutes
        const end = 0;

        for (const event of eventsOnDay) {
            if (event.type === 'working_hour') {
                console.log(event)
                if (event.minutesIntoDay < start) {
                    start = event.minutesIntoDay;
                }
                if (event.minutesIntoDay + event.duration > end) {
                    end = event.minutesIntoDay + event.duration;
                }
            }
        }

        console.log(start, end)

        return {start: start, end: end}

    }

    const calculateAvailableStartTimes = async (date) => {

        const formattedDate = formatDate(date);

        console.log(formattedDate)
        console.log(all)

        if (!loadedDates.includes(formattedDate)){
            console.log('redoing')
            fetchTimetableData(date, date, coachSlug);
        } else {
            console.log('checing')

            const eventsOnDay = all[formattedDate];
            const availableStartTimes = {};
        
            // Define the start and end of the day in minutes
            
            const startAndEnd = calculateStartAndEndTimes(eventsOnDay)

            const startOfDay = startAndEnd.start; // 00:00
            const endOfDay = startAndEnd.end; // 24:00
        
            // Define the duration of each time slot in minutes
            const timeSlotDuration = 15;
        
            // Iterate over the time slots in the day
            for (let startTime = startOfDay; startTime < endOfDay; startTime += timeSlotDuration) {
                // Iterate over the possible durations
                for (let duration = timeSlotDuration; duration <= endOfDay - startTime; duration += timeSlotDuration) {
                    // Check if the time slot can fit the event without overlapping any other events
                    if (eventsOnDay.every(event => !overlaps(startTime, duration, event))) {
                        // Convert the start time to a 24-hour time format
                        const hours = Math.floor(startTime / 60);
                        const minutes = startTime % 60;
                        const formattedStartTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
                        if (!availableStartTimes[formattedStartTime]) {
                            availableStartTimes[formattedStartTime] = [];
                        }
                        availableStartTimes[formattedStartTime].push(duration);
                    }
                }
            }
        
            setAvailableStartTimes(availableStartTimes);
        }
    }
    
    console.log(all)
    // Helper function to check if a time slot overlaps with an event
// Helper function to check if a time slot overlaps with an event
function overlaps(startTime, duration, event) {
    // If the event is a working hour, use startTimeWithoutGlobal and durationWithoutGlobal
    if (event.type === 'working_hour' || event instanceof WorkingHoursObject) {
        return startTime < event.startTimeWithoutGlobal + event.durationWithoutGlobal && startTime + duration > event.startTimeWithoutGlobal;
    } else {
        return startTime < event.minutesIntoDay + event.duration && startTime + duration > event.minutesIntoDay;
    }
}

    const setDate = (e) => {
        const date = new Date(e.target.value);

        const formattedDate = formatDate(date);

        const today = new Date();
        today.setHours(0,0,0,0);

        if (date < today){
            setIsDateValid(false);
            return
        }
        setSelectedDate(date);
        calculateAvailableStartTimes(date);
        setStartTime(null);
        setDuration(null);

    }

    return (
        <div>
            <Label>
                Date
                <InputField 
                    type="date"
                    value={dateToString(selectedDate)} 
                    onChange={setDate}
                />
                {!isDateValid && <p css={css`color: red;`}>Please select a valid date (today or in the future).</p>}
            </Label>

            <Label>
                Start Time
                <SelectField>
                    <option value="">Select a start time</option>
                    {availableStartTimes && Object.keys(availableStartTimes).map(startTime => (
                        <option key={startTime} value={startTime}>{startTime}</option>
                    ))}
                </SelectField>
            </Label>
        </div>
    )

}
