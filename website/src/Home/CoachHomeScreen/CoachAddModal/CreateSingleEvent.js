import React, { useState } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';

import TimeSelect from '../ChooseTimeComponent'
import ChooseDateComponent from './ChooseDateComponent';

export default function CreateSingleEvent({ onClose }) {
    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    const handleSubmit = () => {
        // Handle the submission logic for the single event
        onClose();
    };

    return (
        <Box>
            <ChooseDateComponent date={startDate} setDate={setStartDate} label={"Select a Start Date"}/>
            <TimeSelect time={startTime} setTime={setStartTime} label={"Start Time"}/>
            
            <ChooseDateComponent date={startDate} setDate={setStartDate} label={"Select an End Date"} optional={true}/>
            <TimeSelect time={endTime} setTime={setEndTime} label={"End Time"}/>

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
