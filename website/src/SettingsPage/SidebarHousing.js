import React, { useState, useEffect } from 'react';
import axios from 'axios';

import PropTypes from 'prop-types';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`vertical-tabpanel-${index}`}
            aria-labelledby={`vertical-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
}

TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `vertical-tab-${index}`,
        'aria-controls': `vertical-tabpanel-${index}`,
    };
}

export default function SidebarHousing ({firstSelected, _titles, _components, _endpoints}) {
    const [selected, setSelected] = useState(firstSelected);
    const [titles, setTitles] = useState(_titles);
    const [components, setComponents] = useState(_components);

    const [selectedIndex, setSelectedIndex] = useState(null);
  
    const updateTitle = (oldTitle, newTitle) => {
      setTitles((prevTitles) => 
        prevTitles.map((title) => (title === oldTitle ? newTitle : title))
      );
    };

    useEffect(() => {
        checkEndpoint();
    }, []);

    const checkEndpoint = async () => {

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            console.log(response);

            const data = response.data;

            // iterate through the endpoints, check if that variable exists in the response
            // if it does, check if it's false
            // if it's false, add the error message to the sidebar item
            // if it's true, remove the error message from the sidebar item
            // if it doesn't exist, do nothing

            for (const endpoint of _endpoints) {
                if (data[endpoint] === false) {
                    const index = _endpoints.indexOf(endpoint);
                    const title = _titles[index];
                    updateTitle(title, `${title} - Requires Setup`);
                } else {
                    // if requires setup is already in the title, remove it
                    const index = _endpoints.indexOf(endpoint);
                    const title = _titles[index];

                    console.log(title)

                    updateTitle(`${title} - Requires Setup`, title)

                }
                
            }

        } catch (error) {
            // Handle the error
            console.error(error);
        }

    }

    const handleChange = (event, newValue) => {
        setSelected(titles[newValue]);
        setSelectedIndex(newValue);
    };
    
    useEffect(() => {
        const index = titles.indexOf(selected);
        setSelectedIndex(index);
    
    }, [selected, titles])

    const SelectedContent = selectedIndex !== null && components[selectedIndex];  

    return (
        <Box sx={{ display: 'flex', width: '2000px' }}>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={selectedIndex}
                onChange={handleChange}
                aria-label="Vertical tabs example"
                sx={{ borderRight: 1, borderColor: 'divider', width: '200px' }} // Add width here
            >
                {titles.map((title, index) => (
                    <Tab key={title} label={title} {...a11yProps(index)} sx={{ width: '200px' }} /> // Add width here
                ))}
            </Tabs>
            {titles.map((title, index) => (
                <TabPanel key={title} value={selectedIndex} index={index}>
                    {selectedIndex === index && _components[index] && <SelectedContent refresh={checkEndpoint} />}
                </TabPanel>
            ))}
        </Box>
    );
}
