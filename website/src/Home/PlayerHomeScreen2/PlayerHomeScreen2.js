import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import axios from "axios"
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import dayjs from 'dayjs';
import DateTimeDurationSelector from "../ChooseDateTimeDuration";
import { CircularProgress } from "@mui/material";

export default function PlayerHomeScreen2() {

    const { coachSlug } = useParams()
    const navigate = useNavigate()

    const [selectedDate, setSelectedDate] = useState(dayjs());
    const [selectedTime, setSelectedTime] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);

    const [checking, setChecking] = useState(false);

    const [durations, setDurations] = useState([]);    

    const [invalidSlug, setInvalidSlug] = useState(false);

    const [ready, setReady] = useState(false);

    const getCoachDurations = async () => {
            
        try {

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/coach/${coachSlug}/durations`);

            const data = response.data;
            
            setDurations(data.durations);

        } catch (error) {
            console.log(error);
            if (error.response.data.error === 'Invalid slug') { 
                setInvalidSlug(true);
            }
        }
        
    }

    const checkReady = async () => {
        setChecking(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/coach/${coachSlug}/ready`);
            const data = response.data;

            setReady(data);
        } catch (error) {
            console.log(error);
        }
        setChecking(false);

    }

    useEffect(() => {
        getCoachDurations();
        checkReady();
    }, [])

    const navigateToConfirmBooking = () => {
        navigate(`/${coachSlug}/confirm?startTime=${selectedTime}&duration=${selectedDuration}`)
    }
     
    return !invalidSlug ? 
        (checking ? 
            (
                <CircularProgress/>
            ) : ready ? (
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
                    >
                        <DateTimeDurationSelector
                            selectedDate={selectedDate}
                            selectedTime={selectedTime}
                            selectedDuration={selectedDuration}
                            setSelectedDate={setSelectedDate}
                            setSelectedTime={setSelectedTime}
                            setSelectedDuration={setSelectedDuration}
                            coachSlug={coachSlug}

                        />
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!selectedDate || !selectedTime || !selectedDuration}
                            onClick={() => navigateToConfirmBooking()}
                            sx={{ mt: 2, width: '100%' }}
                        >
                            Confirm
                        </Button>
                    </Box>
                </Container>
    ): (<>
        Coach not setup their account yet
    </>)): (
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
            >
                <h1>Invalid URL</h1>
            </Box>
        </Container>
    )

}