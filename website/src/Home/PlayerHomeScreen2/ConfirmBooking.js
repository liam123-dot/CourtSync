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
import LessonCostComponent from '../LessonCostComponent';
import CircularProgress from '@mui/material/CircularProgress';
import Backdrop from '@mui/material/Backdrop';
// In SearchComponent
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const Header = ({startTime, duration, pricingData}) => {

    // using the start time in epoch seconds and the duration in minutes
    // display the start and end time HH:MM - HH:MM

    const start = new Date(startTime * 1000);
    const end = new Date(startTime * 1000 + duration * 60000);

    const startHours = start.getHours().toString().padStart(2, '0');
    const startMinutes = start.getMinutes().toString().padStart(2, '0');

    const endHours = end.getHours().toString().padStart(2, '0');
    const endMinutes = end.getMinutes().toString().padStart(2, '0');

    const date = start.toLocaleDateString(); // Add this line

    const navigate = useNavigate();

    const handleBackClick = () => {
        navigate(-1);
    }

    return (
    <Container maxWidth="md">
                <Box sx={{ flexGrow: 0, marginRight: 2 }}> {/* Adjust marginRight as needed */}
                    <Button startIcon={<ArrowBackIosIcon />} onClick={handleBackClick}>
                        Datetime Selection
                    </Button>
                </Box>
        <Paper elevation={6} sx={{ padding: 3, marginTop: 3, marginBottom: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start' }}>
                {/* Back Button aligned to the top */}
    
                {/* The rest of the content in a vertically centered column */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
                    <Typography variant="h5" align="center" color="primary" gutterBottom>
                        Confirm your booking
                    </Typography>
                    <Typography variant="subtitle1" gutterBottom>
                        {date}, {startHours}:{startMinutes} - {endHours}:{endMinutes}
                    </Typography>
                    {pricingData && (
                        <LessonCostComponent data={pricingData} />
                    )}
                </Box>
            </Box>
        </Paper>
    </Container>
    

    );

}

export default function ConfirmBooking() {

    const {showPopup} = usePopup();
    const { coachSlug } = useParams()

    const query = useQuery();
    const startTime = query.get('startTime');
    const duration = query.get('duration');

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

    const [isSendVerifyEmailLoading, setIsSendVerifyEmailLoading] = useState(false);
    const [isCheckVerifyEmailCodeLoading, setIsCheckVerifyEmailCodeLoading] = useState(false);

    const [pricingData, setPricingData] = useState({});

    const [submitLoading, setSubmitLoading] = useState(false);

    const [lessonBooked, setLessonBooked] = useState(false);

    const [contactLoading, setContactLoading] = useState(false);

    const getPricing = async () => {

        try {
            
            const resposne = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/lesson-cost?startTime=${startTime}&duration=${duration}`);

            setPricingData(resposne.data);

        } catch (error) {
            console.log(error)   
        }

    }

    const getContact = async contactEmail => {
      setContactLoading(true);
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
            setContactLoading(false);
            return true

        } catch (error) {
            console.log(error);
        } finally {
          setContactLoading(false);
        }
      setContactLoading(false);
        return false
    }

    const getContactDetails = async () => {
        setLoading(true);
        const contactEmail = localStorage.getItem('contactEmail');
                
        if (contactEmail) {
            getContact(contactEmail);
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

        setIsSendVerifyEmailLoading(true);

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/verify-email`, {
                email: contactEmail
            });

            showPopup('Success, Verification code sent to email');
            setIsVerifyingEmail(true);

        } catch (error) {

        }

        setIsVerifyingEmail(true);
        setIsSendVerifyEmailLoading(false);
    };

    const handleVerifyEmailCode = async () => {

      setIsCheckVerifyEmailCodeLoading(true);

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/confirm-email`, {
                email: contactEmail,
                code: verificationCode
            });

            showPopup('Success, Email verified');
            setEmailVerified(true);

            const getContactSuccess = await getContact(contactEmail);

            if (getContactSuccess) {

                setIsAddingNewPlayer(false);

            }
            

        } catch (error) {
            console.log(error)
        }

        setIsCheckVerifyEmailCodeLoading(false);

    }

    const handleSubmit = async () => {

        setSubmitLoading(true);

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/booking`, {
                playerName: isAddingNewPlayer ? newPlayerName : playerName,
                contactName: contactName,
                contactEmail: contactEmail,
                contactPhoneNumber: contactPhoneNumber,
                startTime: startTime,
                duration: duration,
                cost: pricingData.cost,
                rules: pricingData.rules,
                isSameAsPlayerName: false
            });                

            console.log(response);
            showPopup('Success, Booking confirmed');
            setLessonBooked(true);

        } catch (error) {
            console.log(error)
        }

        setSubmitLoading(false);

    }

    const waiting = !(emailVerified || contactEmailFound)

    return (
        <Container maxWidth="md">
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: 2 }}>
            <Header startTime={startTime} duration={duration} pricingData={pricingData}/>            
      
            {!lessonBooked ? (
              !loading ? (
                <Box component="form" noValidate autoComplete="off">
                  <Grid container spacing={2} fullWidth xs={12}>
                    { !contactEmailFound && isVerifyingEmail && !emailVerified ? (
                      <Grid item xs={12}>
                        <TextField
                          label="Verification Code"
                          type="text"
                          value={verificationCode}
                          onChange={(event) => setVerificationCode(event.target.value)}
                          margin="normal"
                          fullWidth
                        />
                      </Grid>
                    ) : (
                      <Grid item xs={12}>
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
      
                    {!contactEmailFound && !emailVerified && (
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          color={!isVerifyingEmail ? "secondary" : "primary"}
                          onClick={!isVerifyingEmail ? handleVerifyEmail : handleVerifyEmailCode}
                          fullWidth
                          sx={{ mt: 3 }}
                        >
                          {!isVerifyingEmail ? (
                            isSendVerifyEmailLoading ? (
                              <CircularProgress/>
                            ): (
                              <Typography>
                                Verify Email
                              </Typography>
                            )): (
                              isCheckVerifyEmailCodeLoading ? (
                                <CircularProgress/>
                              ): (
                                <Typography>
                                  Submit Code
                                </Typography>
                              )
                          )}
                        </Button>
                      </Grid>
                    )}
      
                    {(contactEmailFound || emailVerified) && (contactLoading ? (
                      <CircularProgress/>
                    ): (
                      <> 
                        {isAddingNewPlayer ? (
                          <Grid item xs={12} sm={contactEmailFound ? 8 : 12}>
                            <TextField
                              label="Player Name"
                              type="text"
                              value={newPlayerName}
                              onChange={(event) => {
                                setNewPlayerName(event.target.value.split(' ')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' '));
                              }}
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
                            <Button
                              variant="contained"
                              color={!isAddingNewPlayer ? "secondary" : "primary"}
                              onClick={() => setIsAddingNewPlayer(!isAddingNewPlayer)}
                              fullWidth
                              sx={{ mt: 3 }}
                            >
                              {!isAddingNewPlayer ? "Add New Player" : "Select Existing Player"}
                            </Button>
                          </Grid>
                        )}
      
                        <Grid item xs={12} sm={6}>
                          <TextField
                            label="Contact Name"
                            type="text"
                            value={contactName}
                            onChange={(event) => {
                              setContactName(event.target.value.split(' ')
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(' '));
                            }}
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
                      </>
                    ))}
                  </Grid>
                  <Backdrop
                    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                    open={submitLoading}
                  >
                    <CircularProgress color="inherit" />
                  </Backdrop>
                </Box>
              ) : (
                <Typography variant="h4" align="center">Loading...</Typography>
              )
            ) : (
              <Typography variant="h4" align="center" color="secondary">
                Booking Confirmed! Check your emails for confirmation.
              </Typography>
            )}
          </Box>
        </Container>
      );
      

}
