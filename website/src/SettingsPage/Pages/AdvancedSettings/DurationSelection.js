import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';

import { usePopup } from '../../../Notifications/PopupContext';
import { useSettingsLabels } from '../../SettingsPage2';

export default function DurationSelector() {
    const [selectedDurations, setSelectedDurations] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { showPopup } = usePopup();
    const { refreshLabels } = useSettingsLabels();

    const durations = [30, 60, 90, 120]

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

    useEffect(() => {
        getDurations();
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
            <p>Lessons can only last the durations you select</p>
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
            </Box>
    
            <Button onClick={handleSave} variant="contained" color="primary">
                {isSaving ? <CircularProgress size={24} /> : 'Save'}
            </Button>
        </Box>
    );
}
