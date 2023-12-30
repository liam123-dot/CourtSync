import React, { useState } from "react";
import axios from "axios";
import { Box, Button, TextField, FormControlLabel, Checkbox, Typography } from '@mui/material';
import { usePopup } from "../Notifications/PopupContext";

export default function CreateContact({ setOpen, fetchData }) {
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhoneNumber, setContactPhoneNumber] = useState("");
    const [isPlayerICoach, setIsPlayerICoach] = useState(false);

    const { showPopup } = usePopup();

    const submitContact = async () => {
        const names = contactName.split(' ');
        if (names.length < 2) {
          showPopup("Please enter both a first and last name.");
          return;
        }
      
        const capitalizedNames = names.map(
          name => name.charAt(0).toUpperCase() + name.slice(1)
        );
        const fullName = capitalizedNames.join(' ');
              try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/contact`,
                {
                    name: contactName,
                    email: contactEmail,
                    phone_number: contactPhoneNumber,
                    is_player: isPlayerICoach, // Added is_player_i_coach field
                },
                {
                    headers: {
                        Authorization: `${localStorage.getItem("AccessToken")}`,
                    },
                }
            );

            fetchData();
            setOpen(false);
            showPopup("Contact created successfully");
        } catch (error) {
            console.log(error);
        }
    };

    const handleNameChange = (e) => {
        const names = e.target.value.split(' ');
        const capitalizedNames = names.map(
          name => name.charAt(0).toUpperCase() + name.slice(1)
        );
        const fullName = capitalizedNames.join(' ');
        setContactName(fullName);
      };

      return (
        <Box sx={{
            background: '#f9f9f9',
            padding: 2,
            borderRadius: 1,
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            width: 300,
            margin: '20px auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Box component="form" onSubmit={(e) => e.preventDefault()} sx={{ width: '100%' }}>
                <Typography variant="body1" sx={{ mb: 2 }}>Contact Name:</Typography>
                <TextField
                    fullWidth
                    type="text"
                    value={contactName}
                    onChange={handleNameChange}
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                <Typography variant="body1" sx={{ mb: 2 }}>Contact Email:</Typography>
                <TextField
                    fullWidth
                    type="text"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                <Typography variant="body1" sx={{ mb: 2 }}>Contact Phone Number:</Typography>
                <TextField
                    fullWidth
                    type="text"
                    value={contactPhoneNumber}
                    onChange={(e) => setContactPhoneNumber(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 2 }}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={isPlayerICoach}
                            onChange={(e) => setIsPlayerICoach(e.target.checked)}
                        />
                    }
                    label="Is a player"
                    sx={{ mb: 2 }}
                />
                <Button variant="contained" color="primary" onClick={submitContact} sx={{ mb: 1 }}>
                    Submit
                </Button>
            </Box>
            <Button variant="outlined" onClick={() => setOpen(false)}>Cancel</Button>
        </Box>
    );
}