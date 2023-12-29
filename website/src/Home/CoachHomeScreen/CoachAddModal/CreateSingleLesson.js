import React, { useEffect, useState } from 'react'
import axios from 'axios';

import { Box, Button, Checkbox, Typography, FormControl, InputLabel, OutlinedInput, InputAdornment, CircularProgress } from "@mui/material"
import ChooseTimeComponent from "./ChooseTimeComponent"
import ChooseDateComponent from './ChooseDateComponent';
import AutocompleteBox from './AutocompleteBox';
import InfoComponent from '../../InfoComponent'
import ShowOverlaps from './ShowOverlaps';
import { usePopup } from '../../../Notifications/PopupContext';

import { useRefreshTimetable } from '../RefreshTimetableContext';

export default function CreateSingleLesson({onClose}) {

    const [date, setDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null); // full player object
    
    const [price, setPrice] = useState(0);
    const [overridePricingRules, setOverridePricingRules] = useState(false);
    
    const [players, setPlayers] = useState([]);
    const [playerNames, setPlayerNames] = useState([]); // array of strings of player names

    const [overlappingBookings, setOverlappingBookings] = useState([]);
    const [overlappingEvents, setOverlappingEvents] = useState([]); // array of event objects

    const [isSubmitLoading, setIsSubmitLoading] = useState(false);

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

    const [errorMessage, setErrorMessage] = useState(null);

    const { refresh } = useRefreshTimetable();
    const { showPopup } = usePopup();

    const convertTimeToEpoch = (date, time) => {

        // date is datejs object and time is epoch seconds

        const dateEpoch = date.valueOf() / 1000;

        return dateEpoch + time;

    }

    const convertTimeStringToEpoch = (time) => {

        // split time into hours and minutes
        const timeArray = time.split(':');

        // convert hours and minutes to epoch seconds by taking hours * 3600 and minutes * 60
        const hours = parseInt(timeArray[0]) * 3600;
        const minutes = parseInt(timeArray[1]) * 60;

        // add hours and minutes together to get epoch seconds
        const timeEpoch = hours + minutes;

        return timeEpoch;

    }

    const getPlayers = async () => {

        try {

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/players`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            })

            setPlayers(response.data);
            setPlayerNames(response.data.map(player => player.name));

        } catch (error) {
            console.log(error);
        }

    }

    const calculateStartAndEndTime = () => {            

        const epochStartTime = convertTimeToEpoch(date, convertTimeStringToEpoch(startTime));
        const epochEndTime = convertTimeToEpoch(date, convertTimeStringToEpoch(endTime));

        return {
            startTime: epochStartTime,
            endTime: epochEndTime
        }

    }
        
    useEffect(() => {

        const checkOverlaps = async () => {

            const times = calculateStartAndEndTime();

            if (!times.startTime || !times.endTime) {
                return;
            }

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                },
                params: {
                    from: times.startTime,
                    to: times.endTime
                }
            })

            const data = response.data;

            setOverlappingBookings(data.bookings);
            setOverlappingEvents(data.events);

        }

        if (date && startTime && endTime) {
            
            checkOverlaps();

        }
        
    }, [startTime, endTime, date])

    useEffect(() => {

        if (date && startTime && endTime && selectedPlayer && !errorMessage) {
            setIsSubmitDisabled(false);
        } else {
            setIsSubmitDisabled(true);
        }

    }, [startTime, endTime, date, selectedPlayer])

    const submitLesson = async () => {

        setIsSubmitLoading(true);

        try {

            const times = calculateStartAndEndTime();

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/booking`, {
                startTime: times.startTime,
                duration: (times.endTime - times.startTime) / 60,
                playerId: selectedPlayer.player_id,
            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            })

            onClose();
            refresh(true);
            showPopup('Lesson Created Successfully');

        } catch (error) {
            console.log(error);
        }

        setIsSubmitLoading(false);

    }

    useEffect(() => {
            
        getPlayers();
    
    }, [])

    useEffect(() => {

        if (startTime && endTime) {
            
            if (convertTimeStringToEpoch(startTime) >= convertTimeStringToEpoch(endTime)) {
                setErrorMessage("End time must be after start time");
            } else {
                setErrorMessage(null);
            }

        }

    }, [startTime, endTime])

    useEffect(() => {
        console.log(selectedPlayer);
    }, [selectedPlayer])

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
        }}>
            <Box
                sx={{
                    width: '100%',
                }}
            >
                
                <Box>
                    <ChooseDateComponent date={date} setDate={setDate} label={"Select A Date"}/>
                    <ChooseTimeComponent time={startTime} setTime={setStartTime} label={"Select A Start Time"}/>
                    <ChooseTimeComponent time={endTime} setTime={setEndTime} label={"Select An End Time"} minTime={startTime}/>
                    <AutocompleteBox options={players} value={selectedPlayer} setValue={setSelectedPlayer} label={"Search Players"}/>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body1">
                            Override Pricing Rules
                        </Typography>
                        <Checkbox
                            checked={overridePricingRules}
                            onChange={(event) => setOverridePricingRules(event.target.checked)}
                            inputProps={{ 'aria-label': 'controlled' }}
                        />
                        <InfoComponent message={"Ignores pricing settings, so you can set a fixed price for this lesson"}/>
                    </Box>
                    {
                        overridePricingRules && (
                            <Box>
                                <FormControl fullWidth sx={{ m: 1 }}>
                                    <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
                                    <OutlinedInput
                                        id="outlined-adornment-amount"
                                        startAdornment={<InputAdornment position="start">£</InputAdornment>}
                                        label="Amount"
                                        value={price}
                                        type='number'
                                        onChange={(event) => setPrice(event.target.value)}
                                    />
                                </FormControl>
                            </Box>
                        )
                    }
                </Box>

                {
                    errorMessage && (
                        <Typography variant="body1" color="error">
                            {errorMessage}
                        </Typography>
                    )
                }

                <Button
                    onClick={submitLesson}
                    disabled={isSubmitDisabled}
                >
                    {isSubmitLoading ? <CircularProgress size={24} /> : "Submit"}                    
                </Button>

            </Box>
            {((overlappingBookings && overlappingBookings.length > 0) || (overlappingEvents && overlappingEvents.length > 0)) &&
                <Box sx={{
                    minWidth: '300px',
                }}>
                    <ShowOverlaps bookings={overlappingBookings} events={overlappingEvents}/>
                </Box>
            }
        </Box>
    )

}
