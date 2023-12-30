import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, TextField, Typography, Dialog, DialogActions, DialogContent, DialogTitle, Box, CircularProgress } from '@mui/material';
import { usePopup } from '../../Notifications/PopupContext';
import { useRefreshTimetable } from '../CoachHomeScreen/RefreshTimetableContext';

export default function CancelBooking({ booking, close, onCancelProcess, setOnCancelProcess, cancelRepeat }) {
    const [cancellationNote, setCancellationNote] = useState('');
    const { refresh } = useRefreshTimetable();
    const [isLoading, setIsLoading] = useState(false);
    const {showPopup} = usePopup();

    const cancelLesson = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/timetable/booking/${booking.booking_id}/cancel?cancel_repeats=${cancelRepeat}`,
                { message_to_player: cancellationNote },
                { headers: { 'Authorization': localStorage.getItem('AccessToken') } }
            );
            console.log(response);
            setOnCancelProcess(false);
            showPopup('Booking cancelled successfully');
            refresh(true);
            close();
        } catch (error) {
            console.log(error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        setCancellationNote('');
    }, [onCancelProcess]);

    return (
        <Dialog open={onCancelProcess} onClose={close} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Cancel Booking</DialogTitle>
            <DialogContent>
                <Box pb={2}>
                    <Typography variant="subtitle1">Note to player:</Typography>
                    <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={cancellationNote}
                        onChange={(e) => setCancellationNote(e.target.value)}
                        margin="normal"
                        variant="outlined"
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={close} color="secondary">
                    Cancel
                </Button>
                <Button onClick={cancelLesson} variant="contained" color="primary">
                    {
                        isLoading ?
                            <CircularProgress size={24} /> :
                            'Confirm'
                    }
                </Button>
            </DialogActions>
        </Dialog>
    );
}
