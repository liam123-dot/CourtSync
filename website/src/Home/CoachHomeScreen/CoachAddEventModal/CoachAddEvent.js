import React, {useEffect, useState} from 'react';
import {SaveButton} from '../../CommonAttributes/SaveButton';
import { Spinner } from '../../../Spinner';
import axios from 'axios';
import { useRefreshTimetable } from '../RefreshTimetableContext';
import { checkValid } from './CheckValidRepeat';
import ShowOverlappingEvents from './ShowOverlappingEvents';

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

    const {refresh} = useRefreshTimetable();


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

            refresh();
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

        const doCheck = async () => {

            if (startDate === null || endDate === null || startTime === null || endTime === null ||
                startDate==='' || endDate==='' || startTime==='' || endTime===''){
                setTimesValid(false);
                return
            }
            if (repeats && !repeatType && !repeatUntil) {
                setTimesValid(false);
                return
            }

            setCheckingOverlapsLoading(true);

            const response = await checkValid(startDate, endDate, startTime, endTime, repeats, repeatUntil, repeatType);
            
            if (response.overlaps) {
                setOverlappingEvents(response);
            } else {
                setOverlappingEvents(null);
            }

            setCheckingOverlapsLoading(false);

        }

        doCheck();

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
            <ShowOverlappingEvents overlappingEvents={overlappingEvents} />
        </div>
    )
}
