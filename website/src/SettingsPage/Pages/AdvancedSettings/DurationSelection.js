import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import Dialog from '@mui/material';

import { usePopup } from '../../../Notifications/PopupContext';
import { useSettingsLabels } from '../../SettingsPage2';
import { Typography } from '@mui/material';

export default function DurationSelector() {
    const [selectedDurations, setSelectedDurations] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [bookingScope, setBookingScope] = useState();
    const { showPopup } = usePopup();
    const { refreshLabels } = useSettingsLabels();

    const durations = [15, 30, 45, 60, 75 ,90, 105, 120]

    const toggleDuration = (duration) => {
        const updatedDurations = selectedDurations.includes(duration)
            ? selectedDurations.filter(d => d !== duration)
            : [...selectedDurations, duration].sort((a, b) => a - b);
        setSelectedDurations(updatedDurations);
    };

    const getDurations = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/features/durations`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });
            setSelectedDurations(response.data.durations);
        } catch (error) {
            console.error(error);
        }
        setIsLoading(false);
    };

    const getBookingScope = async () => {

        try {

            // const response = await axios.get(`${process.env.REACT_APP_API_URL}/features/booking-scope`, {
            //     headers: {
            //         Authorization: localStorage.getItem('AccessToken')
            //     }
            // });

            // setBookingScope(response.data.bookingScope);

        } catch (error) {
            console.log(error);
        }

    }

    useEffect(() => {
        getDurations();
        getBookingScope();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL}/features`,
                { durations: selectedDurations },
                { headers: { Authorization: localStorage.getItem('AccessToken') } }
            );
            showPopup('Success');
            refreshLabels();
        } catch (error) {
            console.error(error);
        }
        setIsSaving(false);
    }

    return (
        <Box>
            <Tooltip title="Lessons can only be booked at the durations you select">
                <IconButton
                    onClick={() => setShowDescription(!showDescription)}
                >
                    <FontAwesomeIcon icon={faInfo} />
                </IconButton>  
            </Tooltip>
            <Box>
                {!isLoading && durations.map(duration => (
                    <FormControlLabel
                        key={duration}
                        control={
                            <Checkbox
                                checked={selectedDurations.includes(duration)}
                                onChange={() => toggleDuration(duration)}
                            />
                        }
                        label={`${duration} minutes`}
                    />
                ))}
                {
                    isLoading && <CircularProgress />
                }
                {/* <Typography>Booking Scope (in weeks): </Typography>
                <TextField
                    type="number"
                    value={bookingScope}
                    onChange={setBookingScope}
                    label="Number of Weeks"
                    variant="outlined"
                /> */}
            </Box>
    
            <Button onClick={handleSave} variant="contained" color="primary">
                {isSaving ? <CircularProgress size={24} /> : 'Save'}
            </Button>
        </Box>
    );
}
