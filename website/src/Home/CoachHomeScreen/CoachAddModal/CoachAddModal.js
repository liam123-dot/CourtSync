import React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import CreateSingleLesson from './CreateSingleLesson';
import CreateRepeatingLesson from './CreateRepeatingLesson';
import CreateSingleEvent from './CreateSingleEvent';
import CreateRepeatingEvent from './CreateRepeatingEvent';

import axios from 'axios';
import { useQuery } from 'react-query';

export default function CoachAddModal({ open, handleClose }) {
    const [tabValue, setTabValue] = React.useState(0);
  
    const handleTabChange = (event, newValue) => {
      setTabValue(newValue);
    };

    const getDurations = async ({queryKey}) => {

      return axios.get(
          `${process.env.REACT_APP_API_URL}/features/durations`, {
              headers: {
                  Authorization: localStorage.getItem('AccessToken')
              }
          }
      ).then(response => response.data.durations);

  }

  const { data: durations, isLoading, isError } = useQuery(['durations'], getDurations);
  
    return (
        <Modal open={open} onClose={handleClose}>
          <Box 
              sx={{ 
                  position: 'absolute', 
                  top: '50%', 
                  left: '50%', 
                  transform: 'translate(-50%, -50%)', 
                  bgcolor: 'background.paper', 
                  boxShadow: 24, 
                  p: {xs: 2, sm: 2},
                  width: { xs: '95%', sm: '80%', md: '65%' }, // Responsive width
                  maxWidth: '800px', // Max width of modal
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center', // Center align items horizontally
              }}
          >
            <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="fullWidth" // This will make tabs take the full width
              aria-label="tabs"
              sx={{ minHeight: 48 }} // Add this line to reduce the height of the tabs
            >
              <Tab label="Singular Lesson" />
              <Tab label="Repeating Lesson" />
              <Tab label="Singular Event" />
              <Tab label="Repeating Event" />
            </Tabs>
            <Box sx={{ p: 2, width: '100%' }}>
              {tabValue === 0 && <CreateSingleLesson onClose={handleClose} durations={durations}/>}
              {tabValue === 1 && <CreateRepeatingLesson onClose={handleClose} durations={durations}/>}
              {tabValue === 2 && <CreateSingleEvent />}
              {tabValue === 3 && <CreateRepeatingEvent />}
            </Box>
          </Box>
        </Modal>
      );
}
