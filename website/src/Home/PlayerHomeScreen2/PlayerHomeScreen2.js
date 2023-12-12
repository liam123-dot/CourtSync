import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import TimeBox from "./TimeBox"
import ConfirmBooking from "./ConfirmBooking"
import Box from '@mui/material/Box';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

export default function PlayerHomeScreen2() {

    const { coachSlug } = useParams()
    const navigate = useNavigate()

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);

    const [durations, setDurations] = useState([]);

    const [availableStartTimes, setAvailableStartTimes] = useState();
    
    const [onConfirm, setOnConfirm] = useState(false);

    const getAvailableStartTimes = async () => {
        if (!selectedDate) return;
    
        try {
            // convert date to epoch time in seconds
            const epochTime = selectedDate.unix();
    
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/booking-availability?startTime=${epochTime}&duration=${selectedDuration}`);
    
            const data = response.data;
    
            setAvailableStartTimes(data);
    
        } catch (error) {
            console.log(error);
        }
    }

    const getCoachDurations = async () => {
            
        try {

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/coach/${coachSlug}/durations`);

            const data = response.data;

            setDurations(data);

        } catch (error) {
            console.log(error);
        }
    
        
    }

    useEffect(() => {

        if (!selectedDate) return;
        if (!selectedDuration) return;

        getAvailableStartTimes(selectedDate);

    }, [selectedDate, selectedDuration])

    const handleDurationChange = (e) => {
        console.log(e.target.value);
        setSelectedDuration(e.target.value);
    }

    useEffect(() => {
            
        getCoachDurations();
    }, [])
    
    const handleTimeBoxClick = (startTime) => {
        // If the same time is clicked again, deselect it
        if (selectedTime === startTime) {
            setSelectedTime(null);
        } else {
            setSelectedTime(startTime);
        }
    };
    
    const StartTimeHousing = ({ startTimes }) => {
        return (
            <div style={{ justifyContent: 'center', alignItems: 'center' }}>
                {startTimes.map(startTime => (
                    <TimeBox 
                        key={startTime} 
                        startTime={Number(startTime)} 
                        onClick={() => handleTimeBoxClick(startTime)}
                        isSelected={selectedTime === startTime} // Pass isSelected prop
                    />
                ))}
            </div>
        );
    };

    const handleDateChange = (date) => {
        console.log(date);
        setSelectedDate(date);
    }

    const navigateToConfirmBooking = () => {
        navigate(`/${coachSlug}/confirm?startTime=${selectedTime}&duration=${selectedDuration}`)
    }
     
    return (
        <Container maxWidth="md"> {/* Container for horizontal centering */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    // justifyContent: 'center', // Vertical centering
                    alignItems: 'center', // Horizontal centering
                    minHeight: '100vh', // Full viewport height
                    padding: 2 
                }}
            >
                <FormControl fullWidth margin="normal">
                    <DatePicker
                        label="Select a Date"
                        value={selectedDate}
                        onChange={handleDateChange}
                        format="DD/MM/YYYY"
                        minDate={dayjs().startOf('day')}
                    />
                    {durations.length > 0 && (
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Select a Duration</InputLabel>
                            <Select
                                value={selectedDuration}
                                onChange={(e) => handleDurationChange(e)}
                                label="Select a Duration"
                            >
                                <MenuItem value="">
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
                </FormControl>

                {availableStartTimes && (
                    <StartTimeHousing startTimes={availableStartTimes} />
                )}

                {availableStartTimes && availableStartTimes.length === 0 && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        No available times on this date
                    </Typography>
                )}

                <Button
                    variant="contained"
                    color="primary"
                    disabled={!selectedDate || !selectedTime || !selectedDuration}
                    onClick={() => navigateToConfirmBooking()}
                    sx={{ mt: 2, width: '100%' }}
                >
                    Confirm
                </Button>
            </Box>
        </Container>
    );

}