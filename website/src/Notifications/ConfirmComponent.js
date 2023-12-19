import React from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography, CircularProgress } from '@mui/material';

const ConfirmationPopup = ({ message, onConfirm, onCancel, isConfirming }) => {
    return (
        <Dialog open={true} onClose={onCancel}>
            <DialogContent>
                <Typography>{message}</Typography>
            </DialogContent>
            <DialogActions>
                {isConfirming ? (
                    <CircularProgress size={24} />
                ) : (
                    <Button color="primary" onClick={onConfirm}>
                        Confirm
                    </Button>
                )}
                <Button onClick={onCancel}>Cancel</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmationPopup;
