import React, {useState} from 'react';
import { Box, Link, Snackbar } from '@mui/material';

export default function CalendarSyncPage ({coachSlug}) {

    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const handleLinkClick = async () => {
        try {
            await navigator.clipboard.writeText(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/apple-calendar`);
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to copy', error);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <strong>Apple Calendar Subscription Link (TEST): </strong>
                <Link onClick={handleLinkClick} color="primary" sx={{ cursor: 'pointer' }}>
                    Copy Link
                </Link>
            </Box>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message="Link copied to clipboard"
            />
        </Box>
    )

}
