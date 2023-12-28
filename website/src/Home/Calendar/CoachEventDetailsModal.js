import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import ConfirmationDialog from '../ConfirmationDialog';
import { useRefreshTimetable } from '../CoachHomeScreen/RefreshTimetableContext';
import { duration } from '@mui/material';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30%',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
};

export default function CoachEventDetailsModal({ isOpen, onClose, coachEvent }) {

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [cancelRepeats, setCancelRepeats] = useState(false);

    const {refresh} = useRefreshTimetable();

    if (!isOpen) return null;

    const cancelCoachEvent = async () => {

        try {
            console.log('cancelling')
            console.log(coachEvent)
            const response = await axios.delete(`${process.env.REACT_APP_API_URL}/coach-event/${coachEvent.event_id}?cancel_repeats=${cancelRepeats}`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            
            refresh(true);
            onClose();

        } catch (error) {
            console.log(error);
        }

    }

    console.log(coachEvent);

    return coachEvent && (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
            <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <Typography variant="h6" gutterBottom>
                    Coach Event Details
                </Typography>
                <Typography variant="body1">Title: {coachEvent.inner_title}</Typography>
                <Typography variant="body1">Description: {coachEvent.description}</Typography>
                <Typography variant="body1">Status: {coachEvent.status}</Typography>
                <Typography variant="body1">Start Time: {new Date(coachEvent.start_time * 1000).toLocaleString('en-GB')}</Typography>
                <Typography variant="body1">End Time: {new Date((coachEvent.start_time + (coachEvent.duration_minutes * 60))  * 1000).toLocaleString('en-GB')}</Typography>
                {/* ... other details ... */}
                
                {coachEvent.repeat_id && (
                    <>
                        <Typography variant="body1">Repeat Frequency: {coachEvent.repeat_frequency}</Typography>
                        <Typography variant="body1">
                            Repeat Until: {new Date(coachEvent.repeat_until * 1000).toLocaleDateString('en-GB')}
                        </Typography>
                    </>
                )}
                {coachEvent.status !== 'cancelled' && (
                    <>
                        <Button variant="contained" onClick={() => {
                            setShowConfirmation(true);
                            setCancelRepeats(false);
                        }}>Cancel Event</Button>

                        {coachEvent.repeat_id && (
                            <Button variant="contained" onClick={() => {
                                setShowConfirmation(true);
                                setCancelRepeats(true);
                            }}>Cancel Repeats</Button>
                        )}
                    </>
                )}
                {showConfirmation && (
                    <ConfirmationDialog
                        open={showConfirmation}
                        title="Cancel Event"
                        message={!cancelRepeats ? "Are you sure you want to cancel this event?" : "Are you sure you want to cancel this event and all future repeats?"}
                        onCancel={() => setShowConfirmation(false)}
                        onConfirm={() => {
                            setShowConfirmation(false);
                            cancelCoachEvent();                
                        }}
                    />
                )}
            </Box>
        </Modal>
    );

}
