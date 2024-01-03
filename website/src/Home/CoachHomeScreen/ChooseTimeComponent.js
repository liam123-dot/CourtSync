import React, { useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

export const TimeSelect = ({ time, setTime, label, minTime = "00:00" }) => {
    // Generate time options
    const timeOptions = [];
    const [minHour, minMinute] = minTime.split(':').map(Number);

    for (let hour = minHour; hour < 24; hour++) {
        for (let minute = hour === minHour ? minMinute : 0; minute < 60; minute += 15) {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinute = minute.toString().padStart(2, '0');
            timeOptions.push(`${formattedHour}:${formattedMinute}`);
        }
    }

    const handleKeyPress = (event) => {
        const keyCode = event.keyCode || event.which;
        const keyValue = String.fromCharCode(keyCode);
        if (!/\d|:/.test(keyValue))
            event.preventDefault();
    };

    // Function to handle the change of the selected time
    const handleChange = (event, newValue) => {
        setTime(newValue);
    };

    // Add 24:00 as an option
    timeOptions.push('24:00');

    useEffect(() => {
      console.log(time);
    }, [time]);

    return (
        <Autocomplete
            sx = {{
              mt: 2
            }}
            options={timeOptions}
            value={time}
            onChange={handleChange}
            renderInput={(params) => <TextField {...params} label={label} onKeyPress={handleKeyPress} />}
        />
    );
};

export default TimeSelect;
