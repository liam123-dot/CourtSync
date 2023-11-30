import React, { useState, useEffect } from "react";
import axios from "axios";

export default function EditWorkingHours({workingHours, setWorkingHours}) {

    const fetchWorkingHours = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/working-hours`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });
            // Convert minutes to hh:mm format for initial state
            const formattedData = response.data.map(hour => ({
                ...hour,
                start_time: convertMinutesToHHMM(hour.start_time),
                end_time: convertMinutesToHHMM(hour.end_time)
            }));
            setWorkingHours(formattedData);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchWorkingHours();
    }, []);

    const convertMinutesToHHMM = (minutes) => {
        if (minutes === null) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    const handleTimeChange = (index, type, value) => {
        const updatedHours = [...workingHours];
        updatedHours[index][type] = value;
        setWorkingHours(updatedHours);
    };

    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    return (
        <div>
            {workingHours.map((hour, index) => (
                <div key={hour.working_hour_id}>
                    <label>{days[hour.day_of_week]}:</label>
                    <input
                        type="time"
                        value={hour.start_time || ''}
                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                    />
                    <input
                        type="time"
                        value={hour.end_time || ''}
                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                    />
                </div>
            ))}
        </div>
    );
}
