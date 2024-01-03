import React from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

export default function ChooseDateComponent ({date, setDate, label, optional=false}) {
    const optionalLabel = optional ? `${label} (Optional)` : label;

    return (
        <DatePicker
            label={optionalLabel}
            value={date}
            onChange={setDate}
            format="DD/MM/YYYY"
            minDate={dayjs().startOf('day')}
            sx={{
                width: '100%',
                mt: 2
            }}
        />
    )
}