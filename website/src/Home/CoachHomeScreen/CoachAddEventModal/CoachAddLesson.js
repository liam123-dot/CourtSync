import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRefreshTimetable } from "../RefreshTimetableContext";
import ShowOverlappingEvents from "./ShowOverlappingEvents";
import { Spinner } from "../../../Spinner";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormGroup,
  FormControlLabel,
  Button,
  Typography
} from '@mui/material';
import DateTimeDurationSelector from "../../ChooseDateTimeDuration";

export default function CoachAddLesson ({closeModal}) {

    const {refresh} = useRefreshTimetable();

    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);
    const [errorMessage, setErrorMessage] = useState(null);

    const [players, setPlayers] = useState([])
    const [contact, setContact] = useState(null)

    const [selectedPlayerId, setSelectedPlayerId] = useState(null)

    const [lessonCost, setLessonCost] = useState(null);

    const [repeats, setRepeats] = useState(false);
    const [repeatType, setRepeatType] = useState(null);
    const [repeatUntil, setRepeatUntil] = useState(null);

    const [usePredefinedRules, setUsePredefinedRules] = useState(true);

    const [checkingTimes, setCheckingTimes] = useState(false);
    const [timesValid, setTimesValid] = useState(false);

    const [overlappingEvents, setOverlappingEvents] = useState(null);

    const [repeatTypeLabel, setRepeatTypeLabel] = useState('weeks');
    const [repeatMultiplier, setRepeatMultiplier] = useState(7); // new state for repeat multiplier

    const [saveDisabled, setSaveDisabled] = useState(false);

    useEffect(() => {
        if (overlappingEvents && ((overlappingEvents.bookings && overlappingEvents.bookings.length > 0)
            || (overlappingEvents.events && overlappingEvents.events.length > 0))) {
            setSaveDisabled(true);
        } else {
            setSaveDisabled(false);
        }
    }, [overlappingEvents]);

    const handleRepeatTypeChange = (e) => {
        setRepeatType(e.target.value);
        switch (e.target.value) {
            case 'daily':
                setRepeatTypeLabel('days');
                setRepeatMultiplier(1); // daily multiplier
                break;
            case 'weekly':
                setRepeatTypeLabel('weeks');
                setRepeatMultiplier(7); // weekly multiplier
                break;
            case 'fortnightly':
                setRepeatTypeLabel('fortnights');
                setRepeatMultiplier(14); // fortnightly multiplier
                break;
            case 'monthly':
                setRepeatTypeLabel('months');
                setRepeatMultiplier(30); // rough monthly multiplier
                break;
            default:
                setRepeatTypeLabel('weeks');
                setRepeatMultiplier(7); // default to weekly
        }
    }

    useEffect(() => {

        const fetchPlayers = async () => {
                
            try {

                const response = await axios.get(`${process.env.REACT_APP_API_URL}/players`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                })

                setPlayers(response.data)
                console.log(response.data)

            } catch (error) {
                console.log(error)
            }
        }

        fetchPlayers();

    }, [])

    const handlePlayerChange = (e) => {
        const playerId = Number(e.target.value);
        const player = players.find(player => player.player_id === playerId);
        if (player) {
            setContact(player.contact_name);
            setSelectedPlayerId(player.player_id);
        }
    }

    const handleRepeatUntilChange = value => {
        if (Number(value) > 8) {
            setRepeatUntil(8);
        } else if (Number(value) < 0) {
            setRepeatUntil(1);
        } else {
            setRepeatUntil(value);
        }
    }

    const handleSubmit = async (e) => {

        if (!selectedDate || !selectedStartTime || !selectedDuration || !selectedPlayerId) {
            setErrorMessage("Please select a date, start time, duration and player");
            return;
        }

        try {

            const repeatsUntil = Number(selectedStartTime) + (Number(repeatUntil) * repeatMultiplier * 24 * 60 * 60);

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/booking`, {
                startTime: selectedStartTime,
                duration: selectedDuration,
                playerId: selectedPlayerId,
                repeats: repeats,
                repeats_frequency: repeatType,
                repeats_until: repeatsUntil,
            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            })

            refresh(true);
            closeModal();

        } catch (error) {
            console.log(error)   
        }

    }

    useEffect(() => {
        const doCheck = async () => {
    
            if (!selectedDate || !selectedStartTime || !selectedDuration){
                setTimesValid(false);
                return;
            }
            if (repeats && (!repeatType || !repeatUntil)) {
                setTimesValid(false);
                return;
            }
    
            setCheckingTimes(true);
                        
            try {

                let response;

                console.log(selectedStartTime, selectedDuration)

                const startTime = Number(selectedStartTime);
                const endTime = startTime + (Number(selectedDuration) * 60);

                if (repeats && repeatType && repeatUntil) {
                    
                    const repeatsUntil = startTime + (Number(repeatUntil) * 7 * 24 * 60 * 60);

                    response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${startTime}&to=${endTime}&repeats=${repeats}&repeat_frequency=${repeatType}&repeat_until=${repeatsUntil}`, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    })

                } else {

                    response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${startTime}&to=${endTime}`, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    })

                }

                if (response.data.overlaps) {
                    setOverlappingEvents(response.data);
                } else {
                    setOverlappingEvents(null);
                }
        

            } catch (error) {
                console.log(error);
            }
            setCheckingTimes(false);
        }
    
        doCheck();
    
    }, [selectedDate, selectedStartTime, selectedDuration, repeats, repeatType, repeatUntil]);
    
    
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <DateTimeDurationSelector
                selectedDate={selectedDate}
                selectedTime={selectedStartTime}
                selectedDuration={selectedDuration}
                setSelectedDate={setSelectedDate}
                setSelectedTime={setSelectedStartTime}
                setSelectedDuration={setSelectedDuration}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Player Name</InputLabel>
                <Select
                    value={selectedPlayerId || ''}
                    label="Player Name"
                    onChange={handlePlayerChange}
                >
                    <MenuItem value="" disabled>Select</MenuItem>
                    {players.map((player) => (
                        <MenuItem key={player.player_id} value={player.player_id}>{player.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>

            <Typography variant="body1" gutterBottom>
                Contact Name: {contact}
            </Typography>

            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={usePredefinedRules}
                            onChange={() => setUsePredefinedRules(!usePredefinedRules)}
                        />
                    }
                    label="Use Predefined Cost Rules"
                />
            </FormGroup>

            {!usePredefinedRules && (
                <TextField
                    label="Lesson Cost"
                    type="number"
                    value={lessonCost}
                    onChange={(e) => setLessonCost(e.target.value)}
                    margin="normal"
                    fullWidth
                />
            )}

            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={repeats}
                            onChange={(e) => setRepeats(e.target.checked)}
                        />
                    }
                    label="Repeats"
                />
            </FormGroup>

            {repeats && (
                <>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Repeat Type</InputLabel>
                        <Select
                            value={repeatType || ''}
                            label="Repeat Type"
                            onChange={handleRepeatTypeChange}
                        >
                            <MenuItem value="" disabled>Select Repeat Type</MenuItem>
                            <MenuItem value="daily">Daily</MenuItem>
                            <MenuItem value="weekly">Weekly</MenuItem>
                            <MenuItem value="fortnightly">Fortnightly</MenuItem>
                            <MenuItem value="monthly">Monthly</MenuItem>
                        </Select>
                    </FormControl>
                    <TextField
                        label={`Repeat for how many ${repeatTypeLabel}?`}
                        type="number"
                        value={repeatUntil}
                        onChange={(e) => handleRepeatUntilChange(e.target.value)}
                        margin="normal"
                        fullWidth
                    />
                </>
            )}

            {errorMessage && <Typography color="error">{errorMessage}</Typography>}

            <Button
                variant="contained"
                color="primary"
                onClick={handleSubmit}
                disabled={checkingTimes || saveDisabled}
                startIcon={checkingTimes ? <Spinner /> : null}
            >
                Save Event
            </Button>

            <ShowOverlappingEvents overlappingEvents={overlappingEvents} />
        </div>
    );
}

function formatPriceInPounds(pennies) {
    // Convert pennies to pounds by dividing by 100 and fixing to 2 decimal places
    const pounds = (pennies / 100).toFixed(2);
    // Return the formatted string with the GBP symbol
    return `£${pounds}`;
}
