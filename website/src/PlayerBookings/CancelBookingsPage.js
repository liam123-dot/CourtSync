import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from 'axios';
import { usePopup } from '../Notifications/PopupContext';

import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

function epochToDateTime(epochSeconds) {
    // Create a new Date object with the epoch multiplied by 1000
    const date = new Date(epochSeconds * 1000);

    // Format the date and time
    const dateString = date.toLocaleDateString('en-US'); // Adjust format as needed
    const timeString = date.toLocaleTimeString('en-US'); // Adjust format as needed

    // Combine both date and time into one string
    return `${dateString} ${timeString}`;
}

export default function CancelBookingPage () {

    const {bookingHash} = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [invalidHash, setInvalidHash] = useState(false);

    const [bookingData, setBookingData] = useState(false);

    const [cancellationNote, setCancellationNote] = useState(null);

    const [cancellationLoading, setCancellationLoading] = useState(false);

    const [showMessage, setShowMessage] = useState(null)

    const {showPopup} = usePopup();

    useEffect(() => {

        const fetchBooking = async () => {
            
            setIsLoading(true);

            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/player-bookings/${bookingHash}`)

                const data = response.data;
                
                setBookingData(data);

            } catch (error) {

                console.log(error)
                console.log(error.response)
                console.log(error.response.data)
                console.log(error.response.data.message)

                if (error.response.data.message === 'Lesson Already Cancelled') {
                    setShowMessage('This lesson has already been cancelled')
                    setInvalidHash(false);
                } else {
                    setInvalidHash(true);
                }

            }

            setIsLoading(false)

        }

        fetchBooking();

    }, [])

    const confirmCancel = async () => {
        setCancellationLoading(true);

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/timetable/player-bookings/${bookingHash}/cancel`, {
                messageToCoach: cancellationNote
            })

            console.log(response);
            showPopup('Success')

        } catch (error) {
    
            console.log(error)

        }
        setCancellationLoading(false);

    }

    return (
        <Container maxWidth="sm">
            {isLoading ? (
                <CircularProgress />
            ) : invalidHash ? (
                <Alert severity="error">Invalid Hash</Alert>
            ) : showMessage ? (
                <Alert severity="info">{showMessage}</Alert>
            ) : (
                <div>
                    <Typography variant="h5">Booking Details</Typography>
                    <Typography><b>Player Name:</b> {bookingData.player_name}</Typography>
                    <Typography><b>Start Time:</b> {epochToDateTime(bookingData.start_time)}</Typography>
                    <Typography><b>Duration:</b> {bookingData.duration} minutes</Typography>
                    <Typography><b>Cost:</b> £{(bookingData.cost / 100).toFixed(2)}</Typography>
                    <Typography>Please write a note to your coach explaining reason for cancelling:</Typography>
                    <TextField
                        fullWidth
                        variant="outlined"
                        margin="normal"
                        value={cancellationNote}
                        onChange={(e) => setCancellationNote(e.target.value)}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={confirmCancel}
                        disabled={cancellationLoading}
                    >
                        {cancellationLoading ? <CircularProgress size={24} /> : 'Confirm Cancellation'}
                    </Button>
                </div>
            )}
        </Container>
    );

}