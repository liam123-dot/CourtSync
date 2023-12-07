import React, {useEffect, useState} from 'react';
import {SaveButton} from '../../CommonAttributes/SaveButton';
import { Spinner } from '../../../Spinner';
import axios from 'axios';

export default function CoachAddEvent({closeModal}) {

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [saving, setSaving] = useState(false);

    const [timesValid, setTimesValid] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);

    const [overlappingEvents, setOverlappingEvents] = useState(null);

    const [repeats, setRepeats] = useState(false);
    const [repeatType, setRepeatType] = useState('');
    const [repeatUntil, setRepeatUntil] = useState(4);

    const [saveDisabled, setSaveDisabled] = useState(false);

    const [checkingOverlapsLoading, setCheckingOverlapsLoading] = useState(false);


    useEffect(() => {
        if (overlappingEvents && ((overlappingEvents.bookings && overlappingEvents.bookings.length > 0)
            || (overlappingEvents.events && overlappingEvents.events.length > 0))) {
            setSaveDisabled(true);
        } else {
            setSaveDisabled(false);
        }
    }, [overlappingEvents])
             
    const handleRepeatTypeChange = e => {


        setRepeatType(e.target.value);
    }
    
    const checkValid = async (newStartDate, newEndDate, newStartTime, newEndTime, repeats, repeats_until, repeats_frequency) => {
        console.log(newStartDate, newEndDate, newStartTime, newEndTime);
        setCheckingOverlapsLoading(true);
    
        if (newStartDate === null || newEndDate === null || newStartTime === null || newEndTime === null) {
            setTimesValid(false);
            return;
        }
    
        try {
            // convert the start and end times to epoch time seconds
            const fromTime = new Date(`${newStartDate}T${newStartTime}`);
            const toTime = new Date(`${newEndDate}T${newEndTime}`);
    
            const fromTimeEpoch = Math.floor(fromTime.getTime() / 1000);
            const toTimeEpoch = Math.floor(toTime.getTime() / 1000);
            
            let response;

            if (repeats && repeatType && repeats_until) {

                response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${fromTimeEpoch}&&to=${toTimeEpoch}&repeats=${repeats}&repeat_frequency=${repeats_frequency}&repeat_until=${calculateRepeatsUntil()}`,
                    {
                        headers: {
                            'Authorization': localStorage.getItem('AccessToken')
                        }
                    }
                );

            } else {
                
                response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${fromTimeEpoch}&&to=${toTimeEpoch}`,
                    {
                        headers: {
                            'Authorization': localStorage.getItem('AccessToken')
                        }
                    }
                );
            }
            
            const data = response.data;

            if (data.overlaps){
                setOverlappingEvents({
                    bookings: data.bookings,
                    events: data.events,
                });
            } else {
                setOverlappingEvents(null);
            }
    
        } catch (error) {
            console.log(error);
        }
        setCheckingOverlapsLoading(false);
    }

    const calculateRepeatsUntil = () => {

        // using the start date, add the number of weeks to it specified by repeatUntil
        // then convert that to a epoch time in seconds

        const startDateObj = new Date(`${startDate}T${startTime}`);
        const startDateEpoch = Math.floor(startDateObj.getTime() / 1000);

        const repeatUntilEpoch = startDateEpoch + (repeatUntil * 7 * 24 * 60 * 60);

        return repeatUntilEpoch;

    }

    const handleSave = async () => {

        // check start and end time are in the future

        // none of the fields can be null

        if (startDate === null || endDate === null || startTime === null || endTime === null) {
            setErrorMessage('Start and end times must be set');
            return;
        }

        const fromTime = new Date(`${startDate}T${startTime}`);
        const toTime = new Date(`${endDate}T${endTime}`);

        const fromTimeEpoch = Math.floor(fromTime.getTime() / 1000);
        const toTimeEpoch = Math.floor(toTime.getTime() / 1000);

        const currentTime = Math.floor(Date.now() / 1000);

        if (fromTimeEpoch < currentTime || toTimeEpoch < currentTime) {
            setErrorMessage('Start and end times must be in the future');
            return;
        }

        if (fromTimeEpoch > toTimeEpoch) {
            setErrorMessage('Start time must be before end time');
            return;
        }

        if (title === '') {
            setErrorMessage('Title cannot be empty');
            return;
        }

        setErrorMessage(null);

        setSaving(true);

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/coach-event`,
                {
                    title,
                    description,
                    start_time: fromTimeEpoch,
                    end_time: toTimeEpoch,
                    repeats: repeats,
                    repeats_frequency: repeatType,
                    repeats_until: repeatUntil ? calculateRepeatsUntil() : null,
                },
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );            

            closeModal();

        } catch (error) {
            console.log(error);
        }

        setSaving(false);

    }

    const handleStartDateChange = e => {

        const value = e.target.value;

        setStartDate(value)
        setEndDate(value);

    }

    const handleEndDateChange = e => {

        const value = e.target.value;

        setEndDate(value)

    }

    const handleStartTimeChange = e => {

        const value = e.target.value;

        setStartTime(value)

    }

    const handleEndTimeChange = e => {

        const value = e.target.value;

        setEndTime(value)
    }

    const handleRepeatUntilChange = value => {
        if (Number(value) > 8) {
            setRepeatUntil(8);
        } else if (Number(value) < 0) {
            setRepeatUntil(1);
        } else {
            setRepeatUntil(value);
        }
    }

    useEffect(() => {

        checkValid(startDate, endDate, startTime, endTime, repeats, repeatUntil, repeatType);

    }, [startDate, endDate, startTime, endTime, repeats, repeatType, repeatUntil])

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
        }}>
            <div style={{
                display: 'flex',
                flexDirection: 'column',
            }}>
        
                <label>
                    Start Date
                    <input
                        style={{fontSize: '20px'}}
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                    />
                </label>
                {/* <label>
                    End Date
                    <input
                        style={{fontSize: '20px'}}
                        type="date"
                        value={endDate}
                        onChange={handleEndDateChange}
                    />
                </label> */}
                <label>
                    Start Time
                    <input
                        style={{fontSize: '20px'}}
                        type="time"
                        value={startTime}
                        onChange={handleStartTimeChange}
                    />
                </label>
                <label>
                    End Time
                    <input
                        style={{fontSize: '20px'}}
                        type="time"
                        value={endTime}
                        onChange={handleEndTimeChange}
                    />
                </label>
        
                <label>
                    Title
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => {setTitle(e.target.value)}}
                        placeholder="Enter Title"
                    />
                </label>
                <label>
                    Description
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => {setDescription(e.target.value)}}
                        placeholder="Enter Description"
                    />
                </label>


                <label>
                    Repeats
                    <input
                        type="checkbox"
                        checked={repeats}
                        onChange={(e) => {setRepeats(e.target.checked)}}
                    />
                </label>

                {repeats && (
                    <>
                        <label>
                            Repeat Type
                            <select value={repeatType} onChange={handleRepeatTypeChange}>
                                <option value="" disabled>Select Repeat Type</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="fortnightly">Fortnightly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </label>
                        <label>
                            Repeat for how many weeks?
                            <input
                                type="number"
                                value={repeatUntil}
                                onChange={(e) => {handleRepeatUntilChange(e.target.value)}}
                                style={{width: '50px'}}
                            />
                        </label>
                    </>
                )}
                {
                    errorMessage && (
                        <p style={{color: 'red'}}>{errorMessage}</p>
                    )
                }

                <SaveButton onClick={handleSave} disabled={saveDisabled}>
                    {saving || checkingOverlapsLoading ? 
                        <Spinner/>
                        :
                        <>
                            Save Event
                        </>
                    }
                </SaveButton>

            </div>
            <div>
                {overlappingEvents && (
                    <>
                    {
                        overlappingEvents.bookings.length > 0 && (
                            <>
                                <h2>Overlapping Bookings</h2>
                                <ul>
                                    {overlappingEvents.bookings.map(booking => (
                                        <li key={booking.id}>
                                            {booking.player_name}
                                            <br />
                                            {new Date(booking.start_time * 1000).toLocaleString()}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )
                        
                    }
                    {
                        overlappingEvents.events.length > 0 && (
                            <>
                                <h2>Overlapping Events</h2>
                                <ul>
                                    {overlappingEvents.events.map(event => (
                                        <li key={event.id}>
                                            {event.title}                                      
                                            <br />
                                            {new Date(event.start_time * 1000).toLocaleString()}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )
                    }
                    </>                    
                )}
            </div>
        </div>
    )
}
