import React from 'react';
import { Box, Typography, Paper } from "@mui/material";

export default function ShowOverlaps({ bookings, events }) {
    return (
        <Box sx={{ padding: 2, gap: 2, display: 'flex', flexDirection: 'column' }}>
            
            {bookings && bookings.length > 0 && (
                <Paper elevation={3} sx={{ padding: 2, marginBottom: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Overlapping Bookings
                    </Typography>
                    {bookings.map((booking, index) => (
                        <Box key={index} sx={{ marginBottom: 1 }}>
                            <Typography variant="body1">
                                {booking.player_name}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            )}

            {events && events.length > 0 && (
                <Paper elevation={3} sx={{ padding: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        Overlapping Events
                    </Typography>
                    {events.map((event, index) => (
                        <Box key={index} sx={{ marginBottom: 1 }}>
                            <Typography variant="body1">
                                {event.title}
                            </Typography>
                        </Box>
                    ))}
                </Paper>
            )}

        </Box>
    );
}
