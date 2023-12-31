import React, {useState, useEffect} from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ConfirmationDialog from '../ConfirmationDialog';
import { Accordion, CircularProgress } from '@mui/material';
import axios from 'axios';
import CancelBooking from '../Calendar/CancelBooking';

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '30%',
    minWidth: '400px',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
    p: 4,
  };

export const LessonCost = ({booking, forceExpanded=false, editable=false}) => {

    const [expanded, setExpanded] = useState(forceExpanded);
    const [rulesLoaded, setRulesLoaded] = useState(false);
    const [loadedRules, setLoadedRules] = useState(null);
    const [loading, setLoading] = useState(false); // [true, false
    const [totalCost, setTotalCost] = useState(0);

    const [showDefault, setShowDefault] = useState(false);

    const durationInHours = Math.floor(booking.duration_minutes / 60);
    const durationInMinutes = booking.duration_minutes % 60;
        
    useEffect(() => {
        
        const getRules = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/pricing-rules/${booking.booking_id}`,
                {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken'),
                    }
                })
                setRulesLoaded(true);
                setLoadedRules(response.data.rules);
                setTotalCost(response.data.cost);
            } catch (error) {
                setShowDefault(true);
                console.error(error);
            }
            setLoading(false);
        }
        
        
        if (!rulesLoaded) {
            
            getRules();
            
        }

        console.log(booking)
        
    }, [expanded, rulesLoaded])

    if (showDefault) {
        return (
            <Typography>
                Cost: £{(booking.cost / 100.0).toFixed(2)}
            </Typography>
        )
    }

    return !loading ? (
        loadedRules && (
            <Accordion
                expanded={expanded}
                onChange={() => setExpanded(!expanded)}
                sx={{width: '100%'}}
            >
                <AccordionSummary
                    id="panel1a-header"
                    expandIcon={<ExpandMoreIcon />}
                >
                    <Typography sx={{width: '100%'}}>
                        Lesson Cost:
                    </Typography>
                    <Typography sx={{color: 'text.secondary', marginLeft: 'auto'}}>
                        £{(totalCost / 100.0).toFixed(2)}
                    </Typography>
                </AccordionSummary>
                <AccordionDetails>
                    {!rulesLoaded && (
                        <CircularProgress/>
                    )}
                    <Typography>
                        {loadedRules && loadedRules.hourly && (
                            <>
                                <div>Hourly Rate: £{(loadedRules.hourly.rate / 100.0).toFixed(2)}</div>
                                <div style={{
                                    color: 'grey.500', // For lighter grey color
                                    fontSize: 'small', // For smaller text
                                    fontStyle: 'italic' // For italic text
                                }}>Duration: {durationInHours}H{durationInMinutes !== 0 && `: ${durationInMinutes}M`}</div>
                            </>
                        )}
                    </Typography>
                    <Typography>
                        {loadedRules && loadedRules.extra && loadedRules.extra.length > 0 && (
                            <div>
                                Extra Costs:
                                {loadedRules.extra.map((rule, index) => (
                                    <Typography 
                                        key={index} 
                                        variant="body2" 
                                        sx={{ 
                                            color: 'text.secondary', 
                                            fontStyle: 'italic' 
                                        }}
                                    >
                                        {rule.label}: £{(rule.rate / 100.0).toFixed(2)}
                                    </Typography>
                                ))}
                            </div>
                        )}
                    </Typography>
                </AccordionDetails>
            </Accordion>
        )
    ) : (
        <CircularProgress/>
    )
    
}

export default function LessonDetailsModal2({isOpen, onClose, booking}) {
    
    if (!isOpen) return null;
    
    const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
    const [onCancelProcess, setOnCancelProcess] = useState(false);
    const [cancelRepeats, setCancelRepeats] = useState(false);

    console.log(booking)
    
    return booking && (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={style}>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <List component="nav" aria-label="mailbox folders">
                    <ListItem divider>
                        <Typography>
                            Player Name: {booking.player_name}
                        </Typography>
                    </ListItem>
                    <ListItem divider>
                        <Typography>
                            Contact Name: {booking.contact_name}
                        </Typography>
                    </ListItem>
                    <ListItem divider>
                        <Typography>
                            Contact Email: {booking.contact_email}
                        </Typography>
                    </ListItem>
                    <ListItem divider>
                        <Typography>
                            Contact Phone: {booking.contact_phone_number}
                        </Typography>
                    </ListItem>
                    <ListItem divider>
                        <Typography>
                            Status: {booking.status}
                        </Typography>
                    </ListItem>
                    <ListItem divider>
                        <Typography>
                            Start Time: {new Date(booking.start_time * 1000).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                    </ListItem>
                    <ListItem divider>
                        <Typography>
                            Duration: {booking.duration_minutes} minutes
                        </Typography>
                    </ListItem>

                    {
                        booking.repeat_id && (
                            <>
                                <ListItem divider>
                                    <Typography>
                                        Repeat Frequency: {booking.repeat_frequency}
                                    </Typography>
                                </ListItem>
                                {
                                    booking.repeat_until ? (
                                        <ListItem divider>
                                            <Typography>
                                                Repeat Until: {new Date(booking.repeat_until * 1000).toLocaleDateString('en-GB')}
                                            </Typography>
                                        </ListItem>
                                    ): (
                                        <ListItem divider>
                                            <Typography>
                                                Repeat Indefinitely
                                            </Typography>
                                        </ListItem>
                                    )
                                }
                            </>
                        )
                    }
                    <ListItem divider>
                        <Typography>
                            Invoice Sent: {booking.invoice_sent ? 'Yes' : 'No'}
                        </Typography>
                    </ListItem>
                    {booking.invoice_sent && booking.invoice_cancelled && (
                        <ListItem divider>
                            <Typography>
                                Invoice Cancelled: Yes
                            </Typography>
                        </ListItem>
                    )}
                    { booking.invoice_sent && !booking.invoice_cancelled && (
                        <ListItem divider>
                            <Typography>
                                Invoice Paid: {booking.paid ? 'Yes' : 'No'}
                            </Typography>
                        </ListItem>
                    )}
                    {
                        !booking.invoice_sent && booking.paid && (
                            <ListItem divider>
                                <Typography>
                                    Paid outside of Stripe
                                </Typography>
                            </ListItem>
                        )
                    }
                    <ListItem divider>
                        <LessonCost rules={{
                            cost: booking.cost,
                            // rules: booking.pricing_rule_ids,
                        }} 
                        booking={booking}
                        />
                    </ListItem>

                    {booking.status === 'confirmed' && (
                        <>
                            <Button variant="contained" onClick={() => {
                                setConfirmCancelOpen(true);
                                setCancelRepeats(false);
                            }}>Cancel Lesson</Button>
                            {booking.repeat_id && (
                                <Button variant="contained" onClick={() => {
                                    setConfirmCancelOpen(true);
                                    setCancelRepeats(true);
                                }}>Cancel Repeats</Button>
                            )}
                        </>
                    )}

                    <ConfirmationDialog
                        open={confirmCancelOpen}
                        title="Cancel Booking"
                        message={!cancelRepeats ? "Are you sure you want to cancel this booking?" : "Are you sure you want to cancel this lesson and all repeated lessons after this one?"}
                        onCancel={() => setConfirmCancelOpen(false)}
                        onConfirm={() => {
                            setConfirmCancelOpen(false);
                            setOnCancelProcess(true);
                        }}
                    />

                </List>
                
                <CancelBooking
                    booking={booking}
                    close={() => {
                        setOnCancelProcess(false)
                        onClose();
                    }}
                    onCancelProcess={onCancelProcess}
                    setOnCancelProcess={setOnCancelProcess}
                    cancelRepeat={cancelRepeats}
                />
            </Box>

        </Modal>
    )

}

