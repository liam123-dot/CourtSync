import React, { useState } from 'react';
import { Paper, Typography } from '@mui/material';

export default function TimeBoxComponent({ startTime, onClick, isSelected }) {

    function convertEpochToTime(epochSeconds) {
        const date = new Date(epochSeconds * 1000);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    return (
        <Paper 
            onClick={onClick} // Just call the onClick, no need to toggle state here
            elevation={3}
            sx={{
                display: 'inline-flex',
                padding: '14px 38px',
                backgroundColor: isSelected ? '#4CAF50' : 'black',
                color: 'white',
                borderRadius: '10px',
                margin: '5px',
                cursor: 'pointer',
                '&:hover': {
                    backgroundColor: isSelected ? '#388E3C' : '#333'
                }
            }}
        >
            <Typography variant="body1">
                {convertEpochToTime(startTime)}
            </Typography>
        </Paper>
    );
}
