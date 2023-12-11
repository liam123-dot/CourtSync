import React, { useState, useEffect } from "react";
import axios from "axios";
import { SaveButton } from "../../../Home/CommonAttributes/SaveButton";
import { Spinner } from "../../../Spinner";
import { usePopup } from "../../../Notifications/PopupContext";

export default function WorkingHoursSettings({refreshSettings}) {

    const [workingHours, setWorkingHours] = useState([]);
    const [isSaving, setIsSaving] = useState(false); // [15, 30, 45, 60, 75, 90, 105, 120
    const [errorMessage, setErrorMessage] = useState(null);

    const { showPopup } = usePopup();

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

            // if formattedData is empty, then we need to create a new working hours object for each day of the week

            if (formattedData.length === 0) {
                const newWorkingHours = Array.from({ length: 7 }, (_, i) => ({
                    day_of_week: i,
                    start_time: null,
                    end_time: null
                }));
                setWorkingHours(newWorkingHours);
            }

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

    const saveWorkingHours = async () => {
        setIsSaving(true);
        try {
            const dataToSubmit = workingHours.reduce((acc, hour) => {
                if (hour.start_time && hour.end_time){
                    acc[hour.day_of_week] = {
                        ...hour,
                        start_time: convertHHMMToMinutes(hour.start_time),
                        end_time: convertHHMMToMinutes(hour.end_time)
                    };
                    return acc;
                } else {
                    // make sure both start time and end time are null if one is null
                    acc[hour.day_of_week] = {
                        ...hour,
                        start_time: null,
                        end_time: null
                    };
                    return acc
                }
            }, {});
            console.log(dataToSubmit);
            // Send the converted data to the server
            await axios.post(`${process.env.REACT_APP_API_URL}/timetable/working-hours`, {
                working_hours: dataToSubmit
            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });
            showPopup('Success');
            // Handle successful update
        } catch (error) {
                        
            setErrorMessage(error.response.data.message)
            console.log(error);
        }
        setIsSaving(false);
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

    const handleNoWorkingChange = (index, checked) => {
        const updatedHours = [...workingHours];
        updatedHours[index].noWorking = checked;
        if (checked) {
            updatedHours[index].start_time = null;
            updatedHours[index].end_time = null;
        }
        setWorkingHours(updatedHours);
    };

    const convertHHMMToMinutes = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        return (hours * 60) + minutes;
    };

    return (
        <div style={styles.container}>

            <p>Set the start and end times for each day, no lessons can be booked by players outside these times.</p>

            {workingHours.map((hour, index) => (
                <div key={hour.working_hour_id} style={styles.hourContainer}>
                    <label style={styles.label}>{days[hour.day_of_week]}:</label>
                    <input
                        style={styles.input}
                        type="time"
                        value={hour.start_time || ''}
                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                        disabled={hour.noWorking}
                    />
                    <input
                        style={styles.input}
                        type="time"
                        value={hour.end_time || ''}
                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                        disabled={hour.noWorking}
                    />
                    <label>
                        No Working:
                        <input
                            type="checkbox"
                            checked={hour.noWorking || false}
                            onChange={(e) => handleNoWorkingChange(index, e.target.checked)}
                        />
                    </label>
                </div>
            ))}

            {errorMessage && <p>{errorMessage}</p>}

            <SaveButton onClick={saveWorkingHours}>
                {isSaving ? <Spinner /> : 'Save'}
            </SaveButton>
        </div>
    );
}
