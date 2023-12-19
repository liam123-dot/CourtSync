import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Tab, Tabs, Avatar, Box, Tooltip } from '@mui/material';

export default function NavigationBar() {

    const [timetableLink, setTimetableLink] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [value, setValue] = useState(0);
    const [slug, setSlug] = useState(null);
    const location = useLocation();

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
        } else if (location.pathname.startsWith('/dashboard/players')) {
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

    return (
        <Tooltip 
            title={blockTabs ? "Settings page needs to be completed": ""}
        >
            <div style={{
                width: "100%",
                height: "75px",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                color: "white",
                padding: "0 20px",
                borderBottom: "1px solid #ddd",
            }}>
                    <Tabs value={value} onChange={handleChange} sx={{ flexGrow: 1, marginBottom: '5px' }}>
                        {renderTab("Timetable", `/dashboard${timetableLink}`, 0)}
                        {renderTab("Invoices", "/dashboard/invoices", 1)}
                        {renderTab("Players", "/dashboard/players", 2)}
                        {renderTab("Settings", "/dashboard/settings?tab=profile", 3)}
                    </Tabs>
                    <Avatar src={imageUrl} component={Link} to="/dashboard/settings?tab=profile" style={{ marginLeft: '10px' }} />
            </div>
        </Tooltip>
    );
   
}
