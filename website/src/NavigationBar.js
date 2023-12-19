import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { Tab, Tabs, Avatar, Box } from '@mui/material';

export default function NavigationBar() {

    const [timetableLink, setTimetableLink] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);
    const [value, setValue] = useState(0);
    const [slug, setSlug] = useState(null);
    const location = useLocation();

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

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

    const tabStyle = { fontSize: '1.2em', padding: '10px' };

    return (
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
                <Tab component={Link} to={`/dashboard${timetableLink}`} label="Timetable" sx={tabStyle} />
                <Tab component={Link} to="/dashboard/invoices" label="Invoices" sx={tabStyle} />
                <Tab component={Link} to="/dashboard/players" label="Players" sx={tabStyle} />
                <Tab component={Link} to="/dashboard/settings?tab=profile" label="Settings" sx={tabStyle} />
            </Tabs>
            <Avatar src={imageUrl} component={Link} to="/dashboard/settings?tab=profile" style={{ marginLeft: '10px' }} />
        </div>
    )
   
}
