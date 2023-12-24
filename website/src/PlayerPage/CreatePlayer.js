import React, { useState } from "react";
import axios from "axios";
import { Box, Button, TextField, Typography, FormControl, CircularProgress } from '@mui/material';

export default function CreatePlayer({ contactId, setOpen, fetchData }) {
    const [playerName, setPlayerName] = useState("");
    const [isCreatePlayerLoading, setIsCreatePlayerLoading] = useState(false);

    const submitPlayer = async (e) => {
        e.preventDefault();
        setIsCreatePlayerLoading(true);

        const nameParts = playerName.split(' ');
        if (nameParts.length < 2) {
            alert("Please enter a first name and a surname.");
            return;
        }
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact/${contactId}/player`, {
                name: playerName,
            }, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            })
    
            fetchData();
            setOpen(false);
        } catch (error) {
            console.log(error)
        }
        setIsCreatePlayerLoading(false);
    }

    const handleNameChange = (e) => {
        const value = e.target.value;
        setPlayerName(value.replace(/\b\w/g, char => char.toUpperCase()));
    }

    return (
        <Box sx={{
            background: '#f9f9f9',
            padding: 2,
            borderRadius: 2,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            width: 300,
            margin: '20px auto'
        }}>
            <FormControl component="form" onSubmit={submitPlayer} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="body1">
                    Player names are used to create lessons and ensure invoices and other important information is sent to the correct place
                </Typography>
                <TextField
                    label="Player Name"
                    type="text"
                    value={playerName}
                    onChange={handleNameChange}
                    variant="outlined"
                />
                <Button type="submit" variant="contained" color="primary">
                    {isCreatePlayerLoading ? <CircularProgress/> : "Submit"}
                </Button>
            </FormControl>
            <Button onClick={() => setOpen(false)} sx={{ mt: 1 }}>Cancel</Button>
        </Box>
    );
}
