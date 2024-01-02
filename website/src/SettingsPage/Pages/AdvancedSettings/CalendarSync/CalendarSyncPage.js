import React, {useState} from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { Box, IconButton, Link, Snackbar, Typography, Dialog, CircularProgress } from '@mui/material';
import { DialogTitle, DialogContent } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';

export default function CalendarSyncPage () {
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);

    const fetchCoachSlug = async () => {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/slug`, {
            headers: {
                Authorization: localStorage.getItem("AccessToken"),
            },
        });
        return response.data.slug; // Assuming the slug is directly returned in the response
    };

    const { data: coachSlug, isLoading: slugLoading } = useQuery('coachSlug', fetchCoachSlug);

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
                <Typography>
                    Apple Calendar Sync
                    <IconButton onClick={() => setIsInfoOpen(true)}>
                        <FontAwesomeIcon icon={faInfo} />
                    </IconButton>
                </Typography>
                <Typography>
                    1.⁠ ⁠Go to Calendar App
                </Typography>
                <Typography>
                    2.⁠ ⁠Click 'Calendars' at the bottom middle
                </Typography>
                <Typography>
                    3.⁠ ⁠Click 'Add Calendar' at the bottom left
                </Typography>
                <Typography>
                    4.⁠ ⁠Click 'Add Subscription Calendar'
                </Typography>
                <Typography>
                    5.⁠ ⁠Here paste the link from below
                </Typography>
                <Typography>
                    Link: 
                    {
                        slugLoading ?
                        <CircularProgress size={20} sx={{ ml: 1 }} /> :
                        <Link onClick={handleLinkClick} color="primary" sx={{ cursor: 'pointer' }}>
                            Copy Link
                        </Link>
                    }
                </Typography>
            </Box>
            
            <Dialog open={isInfoOpen} onClose={() => setIsInfoOpen(false)}>
                <DialogTitle>Information</DialogTitle>
                <DialogContent sx={{ p: 2 }}>
                    <Typography sx={{ fontSize: '1.2em' }}>
                        This links your courtsync calendar with your apple calendar, changes here take roughly 5 minutes to change on your apple calendar. Your apple calendar contents will not carry over to your courtsync calendar.
                    </Typography>
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message="Link copied to clipboard"
            />
        </Box>
    )

}
