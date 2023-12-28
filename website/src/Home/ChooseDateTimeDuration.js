import React, {useState, useEffect} from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Paper
} from '@mui/material';
import dayjs from 'dayjs';

function TimeBox({ startTime, onClick, isSelected }) {

    function convertEpochToTime(epochSeconds) {
        const date = new Date(epochSeconds * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    return (
        <Paper 
            onClick={onClick} // Just call the onClick, no need to toggle state here
            elevation={3}
            sx={{
                display: 'inline-flex',
                padding: '14px 38px',
                backgroundColor: isSelected ? '#4CAF50' : 'black',
                color: 'white',
                borderRadius: '10px',
                margin: '5px',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: isSelected ? '#388E3C' : '#333'
                }
            }}
        >
            <Typography variant="body1">
                {convertEpochToTime(startTime)}
            </Typography>
        </Paper>
    );
}


const StartTimeHousing = ({ startTimes, selectedTime, setSelectedTime }) => {
    const handleTimeBoxClick = (startTime) => {
        // If the same time is clicked again, deselect it
        if (selectedTime === startTime) {
            setSelectedTime(null);
        } else {
            setSelectedTime(startTime);
        }
    };
    return (
        <div style={{ justifyContent: 'center', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ marginTop: 2 }}>
                Available Start Times:
            </Typography>
            {startTimes && startTimes.map(startTime => (
                <TimeBox 
                key={startTime} 
                startTime={Number(startTime)} 
                onClick={() => handleTimeBoxClick(startTime)}
                isSelected={selectedTime === startTime} // Pass isSelected prop
                />
                ))}
            {
                startTimes && startTimes.length === 0 && (
                    <Typography variant="body1">
                        No available times for this date
                    </Typography>
                )
            }
        </div>
    );
};

export default function DateTimeDurationSelector({
    selectedDate,
    setSelectedDate,
    selectedDuration,
    setSelectedDuration,
    selectedTime,
    setSelectedTime,
    coachSlug,
    checkDates = false
}) {

    const handleDurationChange = (e) => {
        setSelectedDuration(e.target.value);
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
    };

    const [durations, setDurations] = useState([]);
    const [availableStartTimes, setAvailableStartTimes] = useState();

    const [availableDates, setAvailableDates] = useState({}); // [dayjs, dayjs, ...

    const getCoachDurations = async () => {
            
        try {

            let response;

            if (coachSlug) {
                response = await axios.get(`${process.env.REACT_APP_API_URL}/coach/${coachSlug}/durations`);
            } else {
                response = await axios.get(`${process.env.REACT_APP_API_URL}/coach/durations`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken'),
                    }
                });
            }

            const data = response.data;

            setDurations(data.durations);

        } catch (error) {
            console.log(error);
        }
    
    }

    const getAvailableStartTimes = async () => {
        if (!selectedDate) return;
    
        try {
            // convert date to epoch time in seconds
            const epochTime = selectedDate.unix();
    
            let response;

            if (coachSlug) {
                response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/booking-availability?startTime=${epochTime}&duration=${selectedDuration}`);
            } else {
                response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/booking-availability?startTime=${epochTime}&duration=${selectedDuration}`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken'),
                    }
                });
            }
    
            const data = response.data;
            console.log(data);
            setAvailableStartTimes(data);
    
        } catch (error) {
            console.log(error);
        }
    }

    const checkAvailableDates = async () => {
        
        try {

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/check-days`);

            setAvailableDates(response.data.results);

        } catch (error) {
            console.log(error);
        }

    }

    const shouldDisableDate = (date) => {

        if (!checkDates) return false;

        // keys in available dates are in yyyy-mm-dd format

        const formattedDate = date.format('YYYY-MM-DD');

        return !availableDates[formattedDate];

    }

    useEffect(() => {      
        getCoachDurations();
        if (checkDates) {
            checkAvailableDates();
        }
    }, [])  
    useEffect(() => {

        if (!selectedDate) return;
        if (!selectedDuration) return;

        getAvailableStartTimes(selectedDate);

    }, [selectedDate, selectedDuration])
    return (
        <Box sx={{width: '100%'}}>
            <FormControl fullWidth margin="normal">
                <DatePicker
                    label="Select a Date"
                    value={selectedDate}
                    onChange={handleDateChange}
                    format="DD/MM/YYYY"
                    minDate={dayjs().startOf('day')}
                    shouldDisableDate={shouldDisableDate}
                />
            </FormControl>
            {durations.length > 0 && (
                <FormControl fullWidth margin="normal">
                    <InputLabel>Select a Duration</InputLabel>
                    <Select
                        value={selectedDuration}
                        onChange={handleDurationChange}
                        label="Select a Duration"
                    >
                        <MenuItem value="" disabled>
                            <em>Select a duration</em>
                        </MenuItem>
                        {durations.map(duration => (
                            <MenuItem key={duration} value={duration}>
                                {duration} minutes
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
            
            {availableStartTimes && (
                <StartTimeHousing startTimes={availableStartTimes} selectedTime={selectedTime} setSelectedTime={setSelectedTime}/>
            )}
        </Box>
    );
}
