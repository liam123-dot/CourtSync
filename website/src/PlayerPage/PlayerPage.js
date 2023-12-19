import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Table, TableBody, TableCell, TableContainer, Button, TableHead, TableRow, Paper, IconButton, Collapse, Typography } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CreatePlayer from './CreatePlayer';
import CreateContact from './CreateContact';
import ConfirmationPopup from '../Notifications/ConfirmComponent';
import { usePopup } from '../Notifications/PopupContext';

function PlayerComponent({ player }) {
    // Add PlayerComponent implementation here
    return (
        <Box sx={{ borderBottom: '1px solid #ddd', padding: 2 }}>
            <Typography>{player.name}</Typography>
            {/* Add more player details and actions */}
        </Box>
    );
}

function ContactRow({ contact, fetchData }) {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">{contact.name}</TableCell>
                <TableCell>{contact.email}</TableCell>
                <TableCell>{contact.phone_number}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div">
                                Players
                            </Typography>
                            {contact.players.map((player, index) => (
                                <PlayerComponent key={index} player={player} />
                            ))}
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </React.Fragment>
    );
}

export default function PlayerPage() {
    const [contactData, setContactData] = useState([]);
    const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const { showPopup } = usePopup();

    const fetchData = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/contacts`, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            });
            setContactData(response.data.contacts);
        } catch (error) {
            console.error(error);
        }
    };
    useEffect(() => {
        fetchData();
    }, []);
    
    return (
        <Box sx={{ marginTop: 2 }}>
            <Typography>
                Add details for an individual that you organise lessons with i.e the individual who books and pays for lessons. Inputting ALL information correctly is important for invoices to go to the correct places
            </Typography>                        
            {   isCreateContactOpen ?
                    <CreateContact setOpen={setIsCreateContactOpen} fetchData={fetchData}/>
                    :
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', marginBottom: 2 }}>
                        <Button variant="contained" onClick={() => setIsCreateContactOpen(true)}>Create Contact</Button>
                    </Box>
            }

            <TableContainer component={Paper}>
                <Table aria-label="collapsible table">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Contact Name</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Phone Number</TableCell>
                            {/* Additional Column Headers */}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {contactData.map((contact, index) => (
                            <ContactRow key={index} contact={contact} fetchData={() => {}} />
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {!contactData || contactData.length === 0 && <Typography variant="body1">No contacts found</Typography>}

            {showConfirmationPopup && (
                <ConfirmationPopup
                    message={`Are you sure you want to delete this ${itemToDelete?.type}?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowConfirmationPopup(false)}
                />
            )}
        </Box>
    );
}
