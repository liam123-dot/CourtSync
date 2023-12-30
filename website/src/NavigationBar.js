import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Tab, Tabs, Avatar, Box, Tooltip, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';


export default function NavigationBar() {

    const [timetableLink, setTimetableLink] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [value, setValue] = useState(0);
    const [slug, setSlug] = useState(null);
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const [blockTabs, setBlockTabs] = useState(false);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    const disabledTabStyle = {
        fontSize: '1.2em',
        padding: '10px',
        color: 'grey', // Grey out the tab
        pointerEvents: 'none', // Disable clicking
    };

    const tabStyle = blockTabs ? disabledTabStyle : { fontSize: '1.2em', padding: '10px' };


    useEffect(() => {

        const getSlug = async () => {

            try {
                
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/slug`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                })
                if (response.data.slug) {
                    const slug = response.data.slug;
                    setTimetableLink(`/${slug}`)
                    setSlug(slug)
                }

            } catch (error) {
                console.log(error)
            }

        }

        const checkSetUp = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                    headers: {
                        Authorization: localStorage.getItem("AccessToken"),
                    },
                });
                const data = response.data;     
                
                if (!data.any){
                    console.log("No settings found")
                    setBlockTabs(true);
                }

            } catch (error) {
                console.log(error);
            }
        }

        const getImageUrl = async () => {
            
            try {

                const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/profile_picture_url`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                })
            
                setImageUrl(response.data.profile_picture_url)
                

            } catch (error) {
                console.log(error)
            }

        }

        getSlug();
        getImageUrl();
        checkSetUp();

    }, [])

    useEffect(() => {
        if (location.pathname.startsWith(`/dashboard${timetableLink}`)) {
            setValue(0);
        } else if (location.pathname.startsWith('/dashboard/invoices')) {
            setValue(1);
        } else if (location.pathname.startsWith('/dashboard/contacts')) {
            setValue(2);
        } else if (location.pathname.startsWith('/dashboard/settings')) {
            setValue(3);
        } else {
            setValue(0);
        }
    }, [location, timetableLink]);

    useEffect(() => {
        if (blockTabs) {
            window.location.href = `/#/dashboard/settings?tab=profile`;
        }
    }, [blockTabs]);

    const renderTab = (label, to, index) => {
        return (
            <Tab component={Link} to={to} label={label} sx={tabStyle} disabled={blockTabs && index!==3} />
        );
    };

const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
};

const drawer = (
    <Box
        sx={{ width: 250 }} // Set the width of the drawer
        role="presentation"
        onClick={handleDrawerToggle}
        onKeyDown={handleDrawerToggle}
    >
        <List>
            {/* List of navigation items */}
            <ListItem button component={Link} to={`/dashboard${timetableLink}`}>
                <ListItemText primary="Timetable" />
            </ListItem>
            <ListItem button component={Link} to="/dashboard/invoices">
                <ListItemText primary="Invoices" />
            </ListItem>
            <ListItem button component={Link} to="/dashboard/contacts">
                <ListItemText primary="Contacts" />
            </ListItem>
            <ListItem button component={Link} to="/dashboard/settings?tab=profile">
                <ListItemText primary="Settings" />
            </ListItem>
        </List>
    </Box>
);

return (
    <Box sx={{ flexGrow: 1 }}>
        <Tooltip title={blockTabs ? "Settings page needs to be completed" : ""}>
        <Box sx={{
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '0 20px',
                borderBottom: '1px solid #ddd' // Add a border at the bottom
            }}>
                <IconButton
                    color="inherit"
                    aria-label="open drawer"
                    edge="start"
                    onClick={handleDrawerToggle}
                    sx={{ mr: 2, display: { sm: 'none' } }}
                >
                    <MenuIcon />
                </IconButton>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Tabs value={value} onChange={handleChange} >
                        {renderTab("Timetable", `/dashboard${timetableLink}`, 0)}
                        {renderTab("Invoices", "/dashboard/invoices", 1)}
                        {renderTab("Contacts", "/dashboard/contacts", 2)}
                        {renderTab("Settings", "/dashboard/settings?tab=profile", 3)}                    
                    </Tabs>
                </Box>
                <Avatar src={imageUrl} component={Link} to="/dashboard/settings?tab=profile" sx={{ ml: '10px' }} />
            </Box>
        </Tooltip>
        <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
                keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
                display: { xs: 'block', sm: 'none' },
                '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
            }}
        >
            {drawer}
        </Drawer>
    </Box>
);
}