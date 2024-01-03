import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';

import { convertTimeStringToEpoch, convertTimeToEpoch } from './TimeFunctions';

import TimeSelect from '../ChooseTimeComponent'
import ChooseDateComponent from './ChooseDateComponent';

import { useRefreshTimetable } from '../RefreshTimetableContext';

import axios from 'axios';

export default function CreateSingleEvent({ onClose }) {
    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const [endTimeMinTime, setEndTimeMinTime] = useState("00:00");

    const { refresh } = useRefreshTimetable();

    const handleSubmit = async () => {

        if (!startDate || !startTime || !endTime || !title) return;

        const epochStartTime = convertTimeToEpoch(startDate, convertTimeStringToEpoch(startTime));

        let epochEndTime = null;

        if (endDate) {
            epochEndTime = convertTimeToEpoch(endDate, convertTimeStringToEpoch(endTime));
        } else {
            epochEndTime = convertTimeToEpoch(startDate, convertTimeStringToEpoch(endTime));
        }


        console.log(epochStartTime, epochEndTime)
        
        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/coach-event`, {

                start_time: epochStartTime,
                end_time: epochEndTime,
                title: title,
                description: description

            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });

            refresh(true);
            onClose();

        } catch (error) {
            console.log(error);
        }

    };

    useEffect(() => {

        if (endDate) {
            setEndTimeMinTime("00:00");
        } else {
            setEndTimeMinTime(startTime);
        }

    }, [startDate, startTime, endDate]);

    return (
        <Box>
            <ChooseDateComponent date={startDate} setDate={setStartDate} label={"Select a Start Date"}/>
            <TimeSelect time={startTime} setTime={setStartTime} label={"Start Time"}/>
            
            <ChooseDateComponent date={endDate} setDate={setEndDate} label={"Select an End Date"} optional={true}/>
            <TimeSelect time={endTime} setTime={setEndTime} label={"End Time"} minTime={endTimeMinTime}/>

            <TextField
                fullWidth
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                sx={{ mt: 2 }}
            />

            <TextField
                fullWidth
                label="Description"
                multiline
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mt: 2 }}
            />

            <Button onClick={handleSubmit} sx={{ mt: 2 }}>Submit</Button>
        </Box>
    );
}
