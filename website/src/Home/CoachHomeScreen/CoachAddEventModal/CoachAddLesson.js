import React, { useEffect, useState } from "react";
import ChooseDateTimeComponent from "../../ChooseDateTimeComponent";
import axios from "axios";
import { useRefreshTimetable } from "../RefreshTimetableContext";
import {formatPriceBreakdown} from "../../FormatPriceBreakdown"
import { checkValid } from "./CheckValidRepeat";
import ShowOverlappingEvents from "./ShowOverlappingEvents";
import { SaveButton } from "../../CommonAttributes/SaveButton";
import { Spinner } from "../../../Spinner";

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

    const handleRepeatTypeChange = (e) => {
        setRepeatType(e.target.value);
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

            const repeatsUntil = Number(selectedStartTime) + (Number(repeatUntil) * 7 * 24 * 60 * 60);

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

            refresh();
            closeModal();

        } catch (error) {
            console.log(error)   
        }

    }

    const dateToString = (date) => {
        if (date){
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
        <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
        }}>
            <ChooseDateTimeComponent
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setStartTime={setSelectedStartTime}                
                setDuration={setSelectedDuration}
            />
    
            <label>
                Player Name:
                <select onChange={handlePlayerChange}>
                    <option value="" disabled>Select</option>
                    {players.map((player) => (
                        <option value={player.player_id}>{player.name}</option>
                    ))}
                </select>
            </label>            
    
            <label>
                Contact Name:
                    {contact}
            </label>

            <label>
                Use Predefined Rules:
                <input
                    type="checkbox"
                    checked={usePredefinedRules}
                    onChange={() => setUsePredefinedRules(!usePredefinedRules)}
                />
            </label>

            {!usePredefinedRules && (
                <>
                    {/* lesson price input */}
                    <label>
                        Lesson Cost:
                        <input
                            type="number"
                            value={lessonCost}
                            onChange={(e) => {setLessonCost(e.target.value)}}
                        />
                    </label>
                </>
                )}

            <label>
                Repeats
                <input
                    type="checkbox"
                    checked={repeats}
                    onChange={(e) => {setRepeats(e.target.checked)}}
                />
            </label>

            {repeats && (
                <>
                    <label>
                        Repeat Type
                        <select value={repeatType} onChange={handleRepeatTypeChange}>
                            <option value="" disabled>Select Repeat Type</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="fortnightly">Fortnightly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                    </label>
                    <label>
                        Repeat for how many weeks?
                        <input
                            type="number"
                            value={repeatUntil}
                            onChange={(e) => {handleRepeatUntilChange(e.target.value)}}
                            style={{width: '50px'}}
                        />
                    </label>
                </>
            )}
            
            {errorMessage && <p>{errorMessage}</p>}

            <SaveButton onClick={handleSubmit}>
                {checkingTimes ? 
                    <Spinner/>
                    :
                    <>
                        Save Event
                    </>
                }
            </SaveButton>
            <ShowOverlappingEvents overlappingEvents={overlappingEvents} />
    
        </div>
    )
}

function formatPriceInPounds(pennies) {
    // Convert pennies to pounds by dividing by 100 and fixing to 2 decimal places
    const pounds = (pennies / 100).toFixed(2);
    // Return the formatted string with the GBP symbol
    return `£${pounds}`;
}
