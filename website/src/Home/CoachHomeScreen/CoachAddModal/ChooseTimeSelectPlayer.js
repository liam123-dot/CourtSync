import React, { useState, useEffect } from 'react'

import { Box, Typography, Checkbox, FormControl, InputLabel, OutlinedInput, InputAdornment } from '@mui/material'

import axios from 'axios';

import InfoComponent from '../../InfoComponent'

import ChooseDateComponent from './ChooseDateComponent';
import ChooseTimeComponent from './ChooseTimeComponent';
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
}) {

    const [players, setPlayers] = useState([])

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
    
    return (
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
    )
}
