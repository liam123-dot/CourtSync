import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Container from '@mui/material/Container';
import {usePopup} from '../../Notifications/PopupContext'

const DisplayTime = ({startTime, duration}) => {

    // using the start time in epoch seconds and the duration in minutes
    // display the start and end time HH:MM - HH:MM

    const start = new Date(startTime * 1000);
    const end = new Date(startTime * 1000 + duration * 60000);

    const startHours = start.getHours().toString().padStart(2, '0');
    const startMinutes = start.getMinutes().toString().padStart(2, '0');

    const endHours = end.getHours().toString().padStart(2, '0');
    const endMinutes = end.getMinutes().toString().padStart(2, '0');

    const date = start.toLocaleDateString(); // Add this line

    return (
        <Paper elevation={3} sx={{ padding: 2, marginTop: 2, width:'100%' }}>
            <Typography variant="h6" align="center">
                Confirm your booking for
            </Typography>
            <Typography variant="subtitle1" align="center">
                {date}, {startHours}:{startMinutes} - {endHours}:{endMinutes}
            </Typography>
        </Paper>
    )

}

export default function ConfirmBooking({coachSlug, startTime, duration}) {

    const {showPopup} = usePopup();

    const [loading, setLoading] = useState(true);

    const [contactEmailFound, setContactEmailFound] = useState(false);

    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhoneNumber, setContactPhoneNumber] = useState('');
    const [possiblePlayerNames, setPossiblePlayerNames] = useState([]);
    const [newPlayerName, setNewPlayerName] = useState('');
    const [playerName, setPlayerName] = useState('');

    const [isAddingNewPlayer, setIsAddingNewPlayer] = useState(false);

    const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [emailVerified, setEmailVerified] = useState(false);

    const getPricing = async () => {

        try {
            
            const resposne = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/lesson-cost?startTime=${startTime}&duration=${duration}`);

            console.log(resposne)

        } catch (error) {
            console.log(error)   
        }

    }

    const getContactDetails = async () => {
        setLoading(true);
        const contactEmail = localStorage.getItem('contactEmail');
                
        if (contactEmail) {
            try {
                
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/${coachSlug}/contact/${contactEmail}`);
                
                const data = response.data;

                console.log(data);

                setContactName(data.name);
                setContactEmail(data.email);
                setContactEmailFound(true);                
                setContactPhoneNumber(data.phone_number);
                // data.players is an array objects, convert to array of strings from object['name']
                const playerNames = data.players.map(player => player.name);
                console.log(playerNames)
                setPossiblePlayerNames(playerNames);
                setPlayerName(playerNames[0])

            } catch (error) {
                console.log(error);
            }
        } else {
            setIsAddingNewPlayer(true); // No email found, add new player directly
        }

        setLoading(false);

    }

    useEffect(() => {
        
        getContactDetails();
        getPricing();

    }, []) 

    const handlePlayerChange = (event) => {
        if (event.target.value === "newPlayer") {
            setIsAddingNewPlayer(true);
            setPlayerName('');
        } else {
            setIsAddingNewPlayer(false);
            setPlayerName(event.target.value);
        }
    };

    const handleVerifyEmail = async () => {
        // Logic to send verification code

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/verify-email`, {
                email: contactEmail
            });

            showPopup('Success, Verification code sent to email');
            setIsVerifyingEmail(true);

        } catch (error) {

        }

        setIsVerifyingEmail(true);
    };

    const handleVerifyEmailCode = async () => {

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/confirm-email`, {
                email: contactEmail,
                code: verificationCode
            });

            showPopup('Success, Email verified');
            setEmailVerified(true);

        } catch (error) {
            console.log(error)
        }

    }

    const handleSubmit = async () => {

        console.log(playerName);
        console.log(contactEmail);
        console.log(contactName);
        console.log(contactPhoneNumber);
        console.log(startTime);
        console.log(duration);

    }

    const waiting = !(emailVerified || contactEmailFound)

    return (
        <Container maxWidth="md"> {/* Container for horizontal centering */}
            <Box 
                sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    // justifyContent: 'center', // Vertical centering
                    alignItems: 'center', // Horizontal centering
                    minHeight: '100vh', // Full viewport height
                    padding: 2 
                }}
            >        <DisplayTime startTime={startTime} duration={duration} />
    
            {!loading ? (
                <Box component="form" noValidate autoComplete="off">
                    <Grid container spacing={2}>
                        { !contactEmailFound && isVerifyingEmail && !emailVerified ? (
                            <Grid item xs={12} sm={8}>
                                <TextField
                                    label="Verification Code"
                                    type="text"
                                    value={verificationCode}
                                    onChange={(event) => setVerificationCode(event.target.value)}
                                    margin="normal"
                                    fullWidth
                                />
                            </Grid>
                            ): (
                            <Grid item xs={12} sm={emailVerified ? 12: 8}>
                                <TextField
                                    label="Contact Email"
                                    type="text"
                                    value={contactEmail}
                                    onChange={(event) => setContactEmail(event.target.value)}
                                    margin="normal"
                                    fullWidth
                                    disabled={emailVerified}
                                    />
                            </Grid>
                        )}                        
                        {
                        !contactEmailFound && !emailVerified && (
                            !isVerifyingEmail ? (
                                <Grid item xs={12} sm={4}>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={handleVerifyEmail}
                                        fullWidth
                                        sx={{ mt: 3 }}
                                    >
                                        Verify Email
                                    </Button>
                                </Grid>
                            ) : (
                                <Grid item xs={12} sm={4}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleVerifyEmailCode}
                                        fullWidth
                                        sx={{ mt: 3 }}
                                    >
                                        Submit Code
                                    </Button>
                                </Grid>
                            )
                        )
                        }
                        {isAddingNewPlayer ? (
                            <Grid item xs={12} sm={contactEmailFound ? 8: 12}>
                                <TextField
                                    label="Player Name"
                                    type="text"
                                    value={newPlayerName}
                                    onChange={(event) => setNewPlayerName(event.target.value)}
                                    margin="normal"
                                    fullWidth
                                    disabled={waiting}
                                />
                            </Grid>
                        ) : (
                            <Grid item xs={8} sm={8}>
                                <FormControl fullWidth margin="normal">
                                    <InputLabel>Player Name</InputLabel>
                                    <Select
                                        value={playerName}
                                        onChange={handlePlayerChange}
                                        label="Player Name"
                                    >
                                        {possiblePlayerNames.map((name, index) => (
                                            <MenuItem key={index} value={name}>{name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        )}
                        {contactEmailFound && (
                            <Grid item xs={4} sm={4}>
                                {!isAddingNewPlayer ? (
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => setIsAddingNewPlayer(true)}
                                        fullWidth
                                        sx={{ mt: 3 }}
                                    >
                                        Add New Player
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => setIsAddingNewPlayer(false)}
                                        fullWidth
                                        sx={{ mt: 3 }}
                                    >
                                        Select Existing Player
                                    </Button>
                                )}
                            </Grid>
                            )
                        }

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Contact Name"
                                type="text"
                                value={contactName}
                                onChange={(event) => setContactName(event.target.value)}
                                margin="normal"
                                fullWidth
                                disabled={waiting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Contact Phone Number"
                                type="text"
                                value={contactPhoneNumber}
                                onChange={(event) => setContactPhoneNumber(event.target.value)}
                                margin="normal"
                                fullWidth
                                disabled={waiting}

                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Button 
                            variant="contained" 
                            color="primary" 
                            fullWidth 
                            onClick={handleSubmit}
                            disabled={waiting}
                            >
                                Confirm Booking
                            </Button>
                        </Grid>
                    </Grid>
                </Box>
            ) : (
                <Typography variant="h4" align="center">Loading...</Typography>
            )}
        </Box>
        </Container>
    );
    
    
    
    // !loading ? (
        
        
    // ): (
    //     <div>
    //         <h1>Loading...</h1>
    //     </div>
    // )

}
