import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import { Box, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function InfoComponent({ message }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Box>
      <IconButton onClick={handleClickOpen} size='small'>
        <FontAwesomeIcon icon={faInfo} />
      </IconButton>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>
          Information
          <IconButton
            aria-label="close"
            onClick={handleClose}
            style={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {message}
          </DialogContentText>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
