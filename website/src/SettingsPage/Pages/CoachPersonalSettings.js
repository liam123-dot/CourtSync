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
                    <ChangePasswordScreen/>
                </>
            )}
        </Box>
    );
    
}
