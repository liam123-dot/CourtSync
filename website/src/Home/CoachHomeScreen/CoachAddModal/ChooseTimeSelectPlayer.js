import React, { useState, useEffect } from 'react'

import { Autocomplete, Box, Typography, Checkbox, FormControl, InputLabel, OutlinedInput, InputAdornment, TextField } from '@mui/material'

import axios from 'axios';
import { convertTimeStringToEpoch, convertTimeToEpoch } from './TimeFunctions';

import InfoComponent from '../../InfoComponent'
import TimeSelect from '../ChooseTimeComponent'
import ChooseDateComponent from './ChooseDateComponent';
// import ChooseTimeComponent from './ChooseTimeComponent';
import AutocompleteBox from './AutocompleteBox';

export default function ChooseTimeSelectPlayer({
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    selectedPlayer,
    setSelectedPlayer,
    overridePricingRules,
    setOverridePricingRules,
    price,
    setPrice,
    durations,
}) {

    const [players, setPlayers] = useState([])
    const [duration, setDuration] = useState(null);

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

    useEffect(() => {
        getPlayers();
    }, [])

    useEffect(() => {

        if (date && startTime && duration) {            
            // start time is hh:mm and duration is in minutes
            const startTimeEpoch = convertTimeStringToEpoch(startTime);
            const endTimeEpoch = convertTimeToEpoch(date, startTimeEpoch + duration * 60);

            // convert epoch to hh:mm

            const endTimeString = new Date(endTimeEpoch * 1000).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            setEndTime(endTimeString);
        }

    }, [startTime, duration])

    useEffect(() => {
        console.log(endTime);
    }, [endTime])
    
    return (
        <Box>

            <ChooseDateComponent date={date} setDate={setDate} label={"Select A Date"}/>            
            <TimeSelect time={startTime} setTime={setStartTime} label={"Select a Start Time"}/>
            <Autocomplete
                options={durations}
                value={duration}
                onChange={(event, newValue) => {
                    setDuration(newValue);                    
                }}
                getOptionLabel={(option) => `${option} minutes`}
                renderInput={(params) => <TextField {...params} label={"Select a Duration"}/>}
                sx={{
                    width: '100%',
                    mt: 2
                }}
            />
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
    )
}
