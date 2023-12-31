import React, { useEffect, useState } from 'react';

import { Box, Button, Typography, CircularProgress, FormControl, InputLabel, Select, MenuItem, Checkbox } from "@mui/material"
import axios from 'axios';

import ChooseTimeSelectPlayer from './ChooseTimeSelectPlayer';
import ChooseDateComponent from './ChooseDateComponent';

import { calculateStartAndEndTime } from './TimeFunctions';
import { useRefreshTimetable } from '../RefreshTimetableContext';
import { usePopup } from '../../../Notifications/PopupContext';

export default function CreateRepeatingLesson({onClose}) {

    const [startDate, setStartDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null); // full player object
    const [players, setPlayers] = useState([]);

    const [overridePricingRules, setOverridePricingRules] = useState(false);
    const [price, setPrice] = useState(0);

    const [repeatIndefinitely, setRepeatIndefinitely] = useState(true);
    const [repeatUntil, setRepeatUntil] = useState(null);

    const [repeatType, setRepeatType] = useState(null);  
    
    const [isSubmitLoading, setIsSubmitLoading] = useState(false);

    const { refresh } = useRefreshTimetable();
    const { showPopup } = usePopup();

    const getPlayers = async () => {

        try {

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/players`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            })

            setPlayers(response.data);

        } catch (error) {
            console.log(error);
        }

    }

    const handleSubmit = async () => {

        setIsSubmitLoading(true);

        try {

            const times = calculateStartAndEndTime(startDate, startTime, endTime);

            const repeatUntilEpoch = repeatUntil ? repeatUntil.unix() : null;

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/booking`, {
                startTime: times.startTime,
                duration: (times.endTime - times.startTime) / 60,
                playerId: selectedPlayer.player_id,
                overridePricingRules: overridePricingRules,
                repeatIndefinitely: repeatIndefinitely,
                repeats: true,
                repeatUntil: repeatUntilEpoch,
                repeatFrequency: repeatType,
            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });

            refresh(true);
            onClose();
            showPopup('Repeating Lessons Successfully Created');

        } catch (error) {
            console.log(error);
        }

        setIsSubmitLoading(false);

    }

    useEffect(() => {
        getPlayers();
    }, [])

    useEffect(() => {
        console.log(repeatUntil);
    }, [repeatUntil])

    const generateLessonSummary = () => {
        let summary = `Lesson scheduled`;

        if (selectedPlayer) {
            summary += ` with ${selectedPlayer.player_name}`;
        }

        if (startDate && startTime && endTime) {
            summary += ` starting on ${startDate.format('dddd, MMMM DD YYYY')} from ${startTime} to ${endTime}`;
        }

        if (repeatType) {
            const repeatMapping = {
                'daily': 'every day',
                'weekly': 'every week'
            };
            summary += `, repeating ${repeatMapping[repeatType] || repeatType}`;
        }

        if (!repeatIndefinitely && repeatUntil) {
            summary += `, until ${repeatUntil.format('dddd, MMMM DD YYYY')}`;
        }

        if (overridePricingRules) {
            summary += `, with overridden pricing set to £${price}`;
        }

        return summary + '.';
    };

    return (
        <Box>

            <FormControl fullWidth sx={{
                marginBottom: 2,
            }}>
                <InputLabel id="demo-simple-select-label">Repeat Type</InputLabel>
                <Select
                    labelId="demo-simple-select-label"
                    id="demo-simple-select"
                    value={repeatType}
                    label="Repeat Type"
                    onChange={(e) => setRepeatType(e.target.value)}
                >
                    <MenuItem value={null} disabled>Choose an Option</MenuItem>
                    <MenuItem value={'daily'}>Daily</MenuItem>
                    <MenuItem value={'weekly'}>Weekly</MenuItem>
                </Select>
            </FormControl>

            <ChooseTimeSelectPlayer
                date={startDate}
                setDate={setStartDate}
                startTime={startTime}
                setStartTime={setStartTime}
                endTime={endTime}
                setEndTime={setEndTime}
                selectedPlayer={selectedPlayer}
                setSelectedPlayer={setSelectedPlayer}
                players={players}
                overridePricingRules={overridePricingRules}
                setOverridePricingRules={setOverridePricingRules}
                price={price}
                setPrice={setPrice}
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

            <Typography variant="body2" sx={{ my: 2 }}>
                {generateLessonSummary()}
            </Typography>

            <Button onClick={handleSubmit}>
                {
                    isSubmitLoading ? (
                        <CircularProgress size={24} />
                    ) : (
                        'Submit'
                    )
                }                
            </Button>

        </Box>
    )

}
