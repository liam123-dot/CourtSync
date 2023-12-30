import { TextField } from "@mui/material";

export default function ChooseTimeComponent({ time, setTime, label, minTime = "00:00" }) {

    const handleTimeChange = e => {
        setTime(e.target.value);
    };

    return (
        <TextField
            label={label}
            type="time"
            value={time || ''}
            onChange={handleTimeChange}
            sx={{
                width: '100%',
                mt: 2
            }}
            InputLabelProps={{shrink: true}}
            inputProps={{ min: minTime }}
        />
    );
}