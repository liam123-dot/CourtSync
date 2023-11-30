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
    const styles = {
        container: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '10px',
        },
        hourContainer: {
            marginBottom: '10px',
            display: 'flex',
            alignItems: 'center',
        },
        label: {
            marginRight: '10px',
        },
        input: {
            marginRight: '10px',
        },
    };

    return (
        <div style={styles.container}>
            {workingHours.map((hour, index) => (
                <div key={hour.working_hour_id} style={styles.hourContainer}>
                    <label style={styles.label}>{days[hour.day_of_week]}:</label>
                    <input
                        style={styles.input}
                        type="time"
                        value={hour.start_time || ''}
                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                    />
                    <input
                        style={styles.input}
                        type="time"
                        value={hour.end_time || ''}
                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                    />
                </div>
            ))}
        </div>
    );
}

