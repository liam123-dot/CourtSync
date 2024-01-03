import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Checkbox, FormControl, InputLabel, Select, MenuItem, TextField } from '@mui/material';

import InfoComponent from '../../InfoComponent'
import TimeSelect from '../ChooseTimeComponent'
import ChooseDateComponent from './ChooseDateComponent';

export default function ScheduleRepeatingLesson({ onClose }) {
    const [repeatType, setRepeatType] = useState('daily');
    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [repeatIndefinitely, setRepeatIndefinitely] = useState(true);
    const [repeatUntil, setRepeatUntil] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        // API call to get players or other initialization
    }, []);

    const generateLessonSummary = () => {
        // Check if startDate is not null
        const startDateString = startDate ? startDate.toLocaleDateString() : 'No Start Date Selected';
        const repeatStr = repeatIndefinitely ? 'until cancelled' : 'for a specific duration';
        const startTimeString = startTime ? `from ${startTime}` : '';
        const endTimeString = endTime ? `to ${endTime}` : '';
        return `Repeating ${repeatType.charAt(0).toUpperCase() + repeatType.slice(1)} starting on ${startDateString} ${startTimeString} ${endTimeString} ${repeatStr}.`;
    };    

    const handleSubmit = () => {
        // Handle the submission logic
        onClose();
    };

    return (
        <Box>
            <FormControl fullWidth>
                <InputLabel>Repeat Type</InputLabel>
                <Select
                    value={repeatType}
                    label="Repeat Type"
                    onChange={(e) => setRepeatType(e.target.value)}
                >
                    <MenuItem value={'daily'}>Daily</MenuItem>
                    <MenuItem value={'weekly'}>Weekly</MenuItem>
                    {/* Add other repeat types as needed */}
                </Select>
            </FormControl>

            <ChooseDateComponent date={startDate} setDate={setStartDate} label={"Select A Date"}/>

            <TimeSelect time={startTime} setTime={setStartTime} label={"Start Time"}/>
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

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body1">
                    Repeat Indefinately?
                </Typography>
                <Checkbox
                    checked={repeatIndefinitely}
                    onChange={(event) => setRepeatIndefinitely(event.target.checked)}
                    inputProps={{ 'aria-label': 'controlled' }}
                />
            </Box>

            {
                !repeatIndefinitely && (
                    <Box>
                        <Typography variant="body1">
                            Repeat Until
                        </Typography>
                        <ChooseDateComponent date={repeatUntil} setDate={setRepeatUntil} label={"Select A Date"}/>
                    </Box>                    
                )
            }

            <Typography variant="body2" sx={{ mt: 2 }}>
                {generateLessonSummary()}
            </Typography>

            <Button onClick={handleSubmit}>Submit</Button>
        </Box>
    );
}
