import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TextField, Checkbox, FormControlLabel, Button, Grid, Typography, Container, FormControl, InputLabel, Select, MenuItem, Box, FormGroup, Divider } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { Spinner } from '../../../Spinner';
import { useRefreshTimetable } from '../RefreshTimetableContext';

import dayjs from 'dayjs';
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

    const [repeatTypeLabel, setRepeatTypeLabel] = useState('weeks');

    const handleRepeatTypeChange = e => {
        setRepeatType(e.target.value);
        switch (e.target.value) {
            case 'daily':
                setRepeatTypeLabel('days');
                break;
            case 'weekly':
                setRepeatTypeLabel('weeks');
                break;
            case 'fortnightly':
                setRepeatTypeLabel('fortnights');
                break;
            case 'monthly':
                setRepeatTypeLabel('months');
                break;
            default:
                setRepeatTypeLabel('weeks');
        }
    }

    useEffect(() => {
        if (overlappingEvents && ((overlappingEvents.bookings && overlappingEvents.bookings.length > 0)
            || (overlappingEvents.events && overlappingEvents.events.length > 0))) {
            setSaveDisabled(true);
        } else {
            setSaveDisabled(false);
        }
    }, [overlappingEvents])
             
    const handleSave = async () => {

        // check start and end time are in the future

        // none of the fields can be null

        if (startDate === null || endDate === null || startTime === null || endTime === null) {
            setErrorMessage('Start and end times must be set');
            return;
        }

        const fromDateTime = combineDateAndTime(startDate, startTime);
        const toDateTime = combineDateAndTime(endDate, endTime);

        const fromTimeEpoch = fromDateTime.unix();
        const toTimeEpoch = toDateTime.unix();

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
                    repeats_until: repeatUntil ? dayjs(startDate).add(repeatUntil * 7, 'day').unix(): null,
                },
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );            

            refresh(true);
            closeModal();

        } catch (error) {
            console.log(error);
        }

        setSaving(false);

    }

    const handleStartDateChange = value => {

        console.log(value);
        setStartDate(value);
        setEndDate(value);

    }

    const handleEndDateChange = e => {
        
        const value = e.target.value;

        setEndDate(value)

    }

    const handleStartTimeChange = value => {
        console.log(value);
        setStartTime(value)

    }

    const handleEndTimeChange = value => {
        console.log(value);
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

    const combineDateAndTime = (date, time) => {
        return dayjs(date)
            .hour(time.hour())
            .minute(time.minute())
            .second(0);
    };

    useEffect(() => {
        const doCheck = async () => {
            if (!startDate || !endDate || !startTime || !endTime) {
                setTimesValid(false);
                return;
            }
            if (repeats && (!repeatType || !repeatUntil)) {
                setTimesValid(false);
                return;
            }

            setCheckingOverlapsLoading(true);

            const fromDateTime = combineDateAndTime(startDate, startTime);
            const toDateTime = combineDateAndTime(endDate, endTime);

            const fromTimeUnix = fromDateTime.unix();
            const toTimeUnix = toDateTime.unix();

            try {

                let response;

                if (repeats) {
                    // Calculate repeats_until if necessary
                    const repeatsUntilUnix = dayjs(startDate).add(repeatUntil * 7, 'day').unix();
                    response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${fromTimeUnix}&to=${toTimeUnix}&repeats=${repeats}&repeat_frequency=${repeatType}&repeat_until=${repeatsUntilUnix}`, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    });
                } else {
                    response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${fromTimeUnix}&to=${toTimeUnix}`, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    });
                }

                const data = response.data;

                if (data.overlaps) {
                    setTimesValid(false);
                    setOverlappingEvents(data);
                } else {
                    setTimesValid(true);
                    setOverlappingEvents(null);
                }

            } catch (error) {
                console.log(error);
            }

            // Handle the response...
            
            setCheckingOverlapsLoading(false);
        };

        doCheck();
    }, [startDate, endDate, startTime, endTime, repeats, repeatType, repeatUntil]);


    useEffect(() => {
        if (overlappingEvents && ((overlappingEvents.bookings && overlappingEvents.bookings.length > 0)
            || (overlappingEvents.events && overlappingEvents.events.length > 0))) {
            setSaveDisabled(true);
        } else {
            setSaveDisabled(false);
        }
    }, [overlappingEvents]);

    return (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Box mb={2} sx={{width: '100%'}}>
            <DatePicker
                sx={{width: '100%'}}
                label="Start Date"
                value={startDate}
                onChange={handleStartDateChange}
                format="DD/MM/YYYY"
                minDate={dayjs().startOf('day')}
            />
        </Box>
        <Box mb={2} sx={{width: '100%'}}>
            <TimePicker
                sx={{width: '100%'}}
                label="Start Time"
                value={startTime}
                onChange={handleStartTimeChange}
            />
        </Box>
        <Box mb={2} sx={{width: '100%'}}>
            <TimePicker
                sx={{width: '100%'}}
                label="End Time"
                value={endTime}
                onChange={handleEndTimeChange}
            />
        </Box>
            <TextField
                label="Title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter Title"
                fullWidth
                margin="normal"
            />
            <TextField
                label="Description"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter Description"
                fullWidth
                margin="normal"
            />
            <FormGroup>
                <FormControlLabel
                    control={<Checkbox checked={repeats} onChange={(e) => setRepeats(e.target.checked)} />}
                    label="Repeats"
                />
            </FormGroup>
            {repeats && (
                <>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Repeat Type</InputLabel>
                        <Select value={repeatType} label="Repeat Type" onChange={handleRepeatTypeChange}>
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="fortnightly">Fortnightly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label={`Repeat for how many ${repeatTypeLabel}?`}
                        type="number"
                        value={repeatUntil}
                        onChange={(e) => handleRepeatUntilChange(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                </>
            )}
            {errorMessage && (
                <Typography color="error" marginY={2}>
                    {errorMessage}
                </Typography>
            )}
            <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSave} 
                disabled={saveDisabled}
                startIcon={saving || checkingOverlapsLoading ? <Spinner /> : null}
                fullWidth
                sx={{ marginTop: 2 }}
            >
                Save Event
            </Button>
            <ShowOverlappingEvents overlappingEvents={overlappingEvents} />
        </Box>
    );
    
}
