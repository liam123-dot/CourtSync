import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Divider, CircularProgress, Link, Snackbar } from '@mui/material';
import ChangePasswordScreen from '../../Authentication/ChangePasswordScreen';

export default function CoachPersonalSettings () {
    const [coachDetails, setCoachDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

    const fetchCoachDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/user/me`,
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );
            setCoachDetails(response.data);
        } catch (error) {
            console.error("Error fetching coach details", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCoachDetails();
    }, []);

    const handleInputChange = (event) => {
        setCoachDetails({ ...coachDetails, [event.target.name]: event.target.value });
    };

    const handleLinkClick = async () => {
        try {
            await navigator.clipboard.writeText(`${process.env.REACT_APP_API_URL}/timetable/${coachDetails.slug}/apple-calendar`);
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Failed to copy', error);
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            {isLoading ? (
                <CircularProgress />
            ) : (
                <>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                        <strong>First Name: </strong>{coachDetails.first_name}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                        <strong>Last Name: </strong>{coachDetails.last_name}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                        <strong>Email: </strong>{coachDetails.email}
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ mb: 2 }}>
                        <strong>Apple Calendar Subscription Link (TEST): </strong>
                        <Link onClick={handleLinkClick} color="primary" sx={{ cursor: 'pointer' }}>
                            Copy Link
                        </Link>
                    </Box>
                    <ChangePasswordScreen/>
                    <Snackbar
                        open={snackbarOpen}
                        autoHideDuration={6000}
                        onClose={() => setSnackbarOpen(false)}
                        message="Link copied to clipboard"
                    />
                </>
            )}
        </Box>
    );
    
}
