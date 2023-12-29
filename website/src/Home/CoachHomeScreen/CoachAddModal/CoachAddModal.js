import React from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

function TabPanel(props) {
    const { children, value, index, ...other } = props;
  
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {value === index && (
          <Box sx={{ p: 3 }}>
            {children}
          </Box>
        )}
      </div>
    );
  }
  

export default function CoachAddModal({ open, handleClose }) {
    const [tabValue, setTabValue] = React.useState(0);
  
    const handleTabChange = (event, newValue) => {
      setTabValue(newValue);
    };
  
    return (
      <Modal open={open} onClose={handleClose}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', bgcolor: 'background.paper', boxShadow: 24, p: 4 }}>
          <IconButton aria-label="close" onClick={handleClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="basic tabs example">
          <Tab label="Singular Lesson" />
          <Tab label="Repeating Lesson" />
          <Tab label="Singular Event" />
          <Tab label="Repeating Event" />
        </Tabs>
        <TabPanel value={tabValue} index={0}>
          Content for Singular Lesson
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          Content for Repeating Lesson
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          Content for Singular Event
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          Content for Repeating Event
        </TabPanel>

        </Box>
      </Modal>
    );
  }