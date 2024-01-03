import React, { useEffect, useState } from 'react'
import axios from 'axios';

import { Box, Button, Typography, CircularProgress } from "@mui/material"
import ShowOverlaps from './ShowOverlaps';
import { usePopup } from '../../../Notifications/PopupContext';

import { convertTimeStringToEpoch, calculateStartAndEndTime } from './TimeFunctions';

import { useRefreshTimetable } from '../RefreshTimetableContext';
import ChooseTimeSelectPlayer from './ChooseTimeSelectPlayer';

export default function CreateSingleLesson({onClose, durations}) {

    const [date, setDate] = useState(null);
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null); // full player object
    
    const [price, setPrice] = useState(0);
    const [overridePricingRules, setOverridePricingRules] = useState(false);
    
    const [players, setPlayers] = useState([]);

    const [overlappingBookings, setOverlappingBookings] = useState([]);
    const [overlappingEvents, setOverlappingEvents] = useState([]); // array of event objects

    const [isSubmitLoading, setIsSubmitLoading] = useState(false);

    const [isSubmitDisabled, setIsSubmitDisabled] = useState(true);

    const [errorMessage, setErrorMessage] = useState(null);

    const { refresh } = useRefreshTimetable();
    const { showPopup } = usePopup();

    useEffect(() => {

        const checkOverlaps = async () => {

            const times = calculateStartAndEndTime();

            if (!times || (!times.startTime || !times.endTime)) {
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

        console.log("useEffect", date, startTime, endTime, selectedPlayer, errorMessage)

        if (date && startTime && endTime && selectedPlayer && !errorMessage) {
            setIsSubmitDisabled(false);
        } else {
            setIsSubmitDisabled(true);
        }

    }, [startTime, endTime, date, selectedPlayer])

    const submitLesson = async () => {

        setIsSubmitLoading(true);

        try {

            const times = calculateStartAndEndTime(date, startTime, endTime);

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
                    <ChooseTimeSelectPlayer
                        date={date}
                        setDate={setDate}
                        startTime={startTime}
                        setStartTime={setStartTime}
                        endTime={endTime}
                        setEndTime={setEndTime}
                        selectedPlayer={selectedPlayer}
                        setSelectedPlayer={setSelectedPlayer}
                        overridePricingRules={overridePricingRules}
                        setOverridePricingRules={setOverridePricingRules}
                        players={players}
                        setPlayers={setPlayers}
                        durations={durations}
                    />
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
