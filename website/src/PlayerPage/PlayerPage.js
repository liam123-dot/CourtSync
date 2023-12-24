import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper, IconButton, Collapse, Fab, Modal } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CreateContact from './CreateContact';
import ConfirmationPopup from '../Notifications/ConfirmComponent';
import AddIcon from '@mui/icons-material/Add';

function PlayerComponent({ player }) {
    return (
        <Box sx={{ borderBottom: '1px solid #ddd', padding: 2 }}>
            <Typography>{player.name}</Typography>
            {/* Add more player details and actions */}
        </Box>
    );
}

function ContactCard({ contact, fetchData }) {
    const [open, setOpen] = useState(false);

    return contact && (
        <Paper sx={{ marginBottom: 2, padding: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{contact.name}</Typography>
                <IconButton aria-label="expand row" onClick={() => setOpen(!open)}>
                    {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </IconButton>
            </Box>
            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ margin: 1 }}>
                    <Typography variant="body1" gutterBottom>Email: {contact.email}</Typography>
                    <Typography variant="body1" gutterBottom>Phone: {contact.phone_number}</Typography>
                    <Typography variant="body2" gutterBottom component="div">Players:</Typography>
                    {contact.players && contact.players.map((player, index) => (
                        <PlayerComponent key={index} player={player} />
                    ))}
                </Box>
            </Collapse>
        </Paper>
    );
}

export default function PlayerPage() {
    const [contactData, setContactData] = useState([]);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(true);

    const fetchData = async () => {
        setContactsLoading(true);
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
        setContactsLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (contactsLoading) {
        return <CircularProgress />;
    }

    return contactData && (
        <Box sx={{ padding: 2 }}>
            <Typography variant="h4" gutterBottom>Player Management</Typography>
            <Typography variant="body1">
                Add details for an individual that you organise lessons with i.e the individual who books and pays for lessons. Inputting ALL information correctly is important for invoices to go to the correct places.
            </Typography>                        

            {contactData.map((contact, index) => (
                <ContactCard key={index} contact={contact} fetchData={fetchData} />
            ))}

            {(!contactData || contactData.length === 0) && (
                <Typography variant="body1">No contacts found.</Typography>
            )}

            {showConfirmationPopup && (
                <ConfirmationPopup
                    message={`Are you sure you want to delete this contact?`}
                    // onConfirm={/* handleConfirmDelete logic */}
                    onCancel={() => setShowConfirmationPopup(false)}
                />
            )}

            <Fab color="primary" aria-label="add" sx={{ position: 'fixed', bottom: 16, right: 16 }} onClick={() => setOpenModal(true)}>
                <AddIcon />
            </Fab>

            <Modal
                open={openModal}
                onClose={() => setOpenModal(false)}
                aria-labelledby="create-contact-modal"
                aria-describedby="create-contact-modal-description"
            >
                <Box sx={{ /* Add your styling for the modal here */ }}>
                    <CreateContact setOpen={setOpenModal} fetchData={fetchData} />
                </Box>
            </Modal>
        </Box>
    );
}
