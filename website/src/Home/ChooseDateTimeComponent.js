import react, {useEffect, useState} from 'react';
import { css } from "@emotion/react";
import styled from '@emotion/styled';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Spinner } from '../Spinner';

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

function formatEpochTime(epoch) {
    // takes epoch time in seconds and returns time in format HH:MM
    const date = new Date(epoch * 1000);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

export default function ChooseDateTimeComponent({
        selectedDate,
        setSelectedDate,
        setStartTime,
        setDuration,
    }) {

    const {coachSlug} = useParams();

    const [isDateValid, setIsDateValid] = useState(true); // New state to track date validity
    const [availableStartTimes, setAvailableStartTimes] = useState({}); // New state to track available start times
    const [availableStartTimesLoading, setAvailableStartTimesLoading] = useState(false); // New state to track loading of available start times

    const [selectedStartTime, setSelectedStartTime] = useState(null); // New state to track selected start time

        // Helper function to check if a time slot overlaps with an event

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
        getAvailableStartTimes(date);
        setStartTime(null);
        setDuration(null);

    }

    const getAvailableStartTimes = async (date) => {

        // get epoch time in seconds of date

        setAvailableStartTimesLoading(true);

        if (!date) return;

        try {

            const epochTime = Math.floor(date.getTime() / 1000);

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/booking-availability?startTime=${epochTime}`);

            setIsDateValid(true);
            setAvailableStartTimes(response.data);

        
        } catch (error) {
            console.log(error);
        }

        setAvailableStartTimesLoading(false)

    }

    const setStartTimeHandler = (e) => {
        setSelectedStartTime(e.target.value);
        setStartTime(e.target.value);
    }

    const setDurationHandler = (e) => {

        setDuration(e.target.value);

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

            {availableStartTimesLoading && <Spinner />}
                
            <Label>
                Start Time
                <SelectField onChange={setStartTimeHandler}>
                    <option value="">Select a start time</option>
                    {availableStartTimes && Object.keys(availableStartTimes).map(startTime => {
                        return (
                            <option key={startTime} value={startTime}>{formatEpochTime(startTime)}</option>
                        )
                    }
                    )}
                </SelectField>
            </Label>

            <Label>
                End Time
                <SelectField onChange={setDurationHandler}>
                    <option value="">Select a end time</option>
                    {availableStartTimes && selectedStartTime && availableStartTimes[selectedStartTime].map(duration => {
                        return (
                            <option key={duration} value={duration}>{duration} minutes</option>
                        )
                    })}
                </SelectField>
            </Label>
            
        </div>
    )

}
