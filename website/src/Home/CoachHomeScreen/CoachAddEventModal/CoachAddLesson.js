import React, { useEffect, useState } from "react";
import ChooseDateTimeComponent from "../../ChooseDateTimeComponent";
import axios from "axios";
import { useRefreshTimetable } from "../RefreshTimetableContext";
import {formatPriceBreakdown} from "../../FormatPriceBreakdown"

export default function CoachAddLesson ({closeModal}) {

    const {refresh} = useRefreshTimetable();

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);

    const [players, setPlayers] = useState([])
    const [contact, setContact] = useState(null)

    const [selectedPlayerId, setSelectedPlayerId] = useState(null)

    const [lessonCost, setLessonCost] = useState(null);
    const [rules, setRules] = useState([]);

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

    useEffect(() => {

        const getPrice = async () => {

            if (selectedDate && selectedStartTime && selectedDuration){
                try {

                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/lesson-cost?startTime=${selectedStartTime}&duration=${selectedDuration}`, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    });

                    setLessonCost(response.data.cost);
                    setRules(response.data.rules);

                } catch (error) {
                    console.log(error);
                }
            }

        }

        getPrice();

    }, [selectedDate, selectedStartTime, selectedDuration, lessonCost]);

    const handlePlayerChange = (e) => {
        const playerId = Number(e.target.value);
        const player = players.find(player => player.player_id === playerId);
        if (player) {
            setContact(player.contact_name);
            setSelectedPlayerId(player.player_id);
        }
    }

    const handleSubmit = async (e) => {

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/booking`, {
                startTime: selectedStartTime,
                duration: selectedDuration,
                rules: rules,
                playerId: selectedPlayerId,
                price: lessonCost
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
                Lesson Cost:
                    {formatPriceInPounds(lessonCost)}
            </label>
            {formatPriceBreakdown(rules)}

            <button onClick={handleSubmit}>Submit</button>
    
        </div>
    )
}

function formatPriceInPounds(pennies) {
    // Convert pennies to pounds by dividing by 100 and fixing to 2 decimal places
    const pounds = (pennies / 100).toFixed(2);
    // Return the formatted string with the GBP symbol
    return `£${pounds}`;
}
