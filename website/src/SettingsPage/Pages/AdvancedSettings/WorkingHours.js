import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Checkbox, FormControlLabel, Grid, TextField, Typography, Box, CircularProgress } from '@mui/material';
import { Save as SaveIcon, HourglassEmpty as SpinnerIcon } from '@mui/icons-material';
import { usePopup } from "../../../Notifications/PopupContext";
import { IconButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';

export default function WorkingHoursSettings({refreshLabels, refreshTimetable}) {

    const [workingHours, setWorkingHours] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const { showPopup } = usePopup();

    useEffect(() => {
        const fetchWorkingHours = async () => {
            setIsLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/working-hours`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                });
    
                let formattedData = response.data.map(hour => ({
                    ...hour,
                    start_time: convertMinutesToHHMM(hour.start_time),
                    end_time: convertMinutesToHHMM(hour.end_time),
                    noWorking: hour.start_time === null && hour.end_time === null
                }));
    
                if (formattedData.length < 7) {
                    for (let i = formattedData.length; i < 7; i++) {
                        formattedData.push({ day_of_week: i, start_time: null, end_time: null, noWorking: false });
                    }
                }
    
                setWorkingHours(formattedData);
            } catch (error) {
                console.log(error);
            }
            setIsLoading(false);
        }
    
        fetchWorkingHours();
    }, []);

    const convertMinutesToHHMM = (minutes) => {
        if (minutes === null) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const handleTimeChange = (index, type, value) => {

        const updatedHours = [...workingHours];
        updatedHours[index][type] = value;
        setWorkingHours(updatedHours);
    };

    const saveWorkingHours = async () => {
        setIsSaving(true);
        try {
            const dataToSubmit = workingHours.reduce((acc, hour) => {
                if (hour.start_time && hour.end_time){
                    acc[hour.day_of_week] = {
                        ...hour,
                        start_time: convertHHMMToMinutes(hour.start_time),
                        end_time: convertHHMMToMinutes(hour.end_time)
                    };
                    return acc;
                } else {
                    // make sure both start time and end time are null if one is null
                    acc[hour.day_of_week] = {
                        ...hour,
                        start_time: null,
                        end_time: null
                    };
                    return acc
                }
            }, {});
            // Send the converted data to the server
            await axios.post(`${process.env.REACT_APP_API_URL}/timetable/working-hours`, {
                working_hours: dataToSubmit
            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });
            showPopup('Success');
            if (refreshLabels) {
                refreshLabels();
            }
            if (refreshTimetable) {
                refreshTimetable(true);
            }
            // Handle successful update
        } catch (error) {
                        
            if (error.response){
                setErrorMessage(error.response.data.message)
            }
            console.log(error);
        }
        setIsSaving(false);
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    const handleNoWorkingChange = (index, checked) => {
        const updatedHours = [...workingHours];
        updatedHours[index].noWorking = checked;
        if (checked) {
            updatedHours[index].start_time = null;
            updatedHours[index].end_time = null;
        }
        setWorkingHours(updatedHours);
    };

    const convertHHMMToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * 60) + minutes;
    };

    return (
        <Box sx={{ p: 2, maxWidth: '80%', margin: '0 auto' }}>
            <Tooltip title="Set the start and end times for each day. No lessons can be booked by players outside these times.">
                <IconButton
                    onClick={() => setShowDescription(!showDescription)}
                >
                    <FontAwesomeIcon icon={faInfo} />
                </IconButton>  
            </Tooltip>
            <Grid container spacing={2} sx={{ mt: 2 }}>
                {workingHours.map((hour, index) => (
                    <Grid item xs={12} key={index} sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography sx={{ mr: 2, minWidth: '100px' }}>{days[hour.day_of_week]}:</Typography>
                        <TextField
                            type="time"
                            value={hour.start_time || ''}
                            onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                            disabled={hour.noWorking}
                            sx={{ mr: 2 }}
                        />
                        <TextField
                            type="time"
                            value={hour.end_time || ''}
                            onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                            disabled={hour.noWorking}
                            sx={{ mr: 2 }}
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={hour.noWorking}
                                    onChange={(e) => handleNoWorkingChange(index, e.target.checked)}
                                />
                            }
                            label="Not Working"
                        />
                    </Grid>
                ))}
                {isLoading && <CircularProgress/>}
            </Grid>
            {errorMessage && (
                <Typography color="error" sx={{ mt: 2 }}>{errorMessage}</Typography>
            )}
            <Button
                variant="contained"
                startIcon={isSaving ? <SpinnerIcon /> : <SaveIcon />}
                onClick={saveWorkingHours}
                sx={{ mt: 3 }}
            >
                {isSaving ? 'Saving...' : 'Save'}
            </Button>
        </Box>
    );

}
