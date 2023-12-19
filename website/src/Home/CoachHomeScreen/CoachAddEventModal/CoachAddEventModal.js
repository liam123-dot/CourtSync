import React, { useState, useEffect } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import styled from '@emotion/styled';
import CoachAddLesson from './CoachAddLesson';
import CoachAddEvent from './CoachAddEvent';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '30%',
  minWidth: '300px', // set a minimum width
  height: '80%', // set a height
  overflow: 'auto', // make it scrollable
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

export default function CoachAddEventModal({ isOpen, onClose}) {

  const [selectedOption, setSelectedOption] = useState('lesson');
  useEffect(() => {
    setSelectedOption('lesson');
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }


  const buttonStyle = (isSelected) => ({
    backgroundColor: isSelected ? 'blue' : '',
    color: isSelected ? 'white' : '',
    margin: '5px',
  });

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
    >
      <Box sx={style}>

        <div>
          <Button 
            style={buttonStyle(selectedOption === 'lesson')} 
            onClick={() => setSelectedOption('lesson')}
          >
            Lesson
          </Button>
          <Button 
            style={buttonStyle(selectedOption === 'other')} 
            onClick={() => setSelectedOption('other')}
          >
            Other
          </Button>
        </div>

        {
          selectedOption === 'lesson' ? (
            <CoachAddLesson closeModal={onClose} />
          ) : (
            <CoachAddEvent closeModal={onClose} />
          )
        }

        <Button onClick={onClose}>Close</Button>
      </Box>
    </Modal>
  );
}
