import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, CircularProgress, Paper, IconButton, Collapse, Fab, Modal, Select, MenuItem } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import CreateContact from './CreateContact';
import ConfirmationPopup from '../Notifications/ConfirmComponent';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreatePlayer from './CreatePlayer';

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
    const [isCreatePlayerOn, setIsCreatePlayerOn] = useState(false);    
    const [isEditingInvoiceType, setIsEditingInvoiceType] = useState(false);
    const [updatingInvoiceType, setUpdatingInvoiceType] = useState(contact.invoice_type);
    const [isSubmiting, setIsSubmiting] = useState(false);

    const handleSubmit = async () => {

        setIsSubmiting(true);

        try {

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/contact/${contact.contact_id}`, {
                invoice_type: updatingInvoiceType,
            }, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            });

            contact['invoice_type'] = updatingInvoiceType;

        } catch (error) {
            console.error(error);
        }

        setIsSubmiting(false);
        setIsEditingInvoiceType(false);

    }

    return contact && (
        <Box>
            <Paper sx={{ marginBottom: 2, padding: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">{contact.name}</Typography>
                    <Box sx={{ ml: 'auto', display: 'flex' }}>
                        <IconButton onClick={() => setIsCreatePlayerOn(true)}>
                            <AddIcon/>
                        </IconButton>
                        <IconButton aria-label="expand row" onClick={() => setOpen(!open)}>
                            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                    </Box>
                </Box>
                <Collapse in={open} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1 }}>
                        <Typography variant="body1" gutterBottom>Email: {contact.email}</Typography>
                        <Typography variant="body1" gutterBottom>Phone: {contact.phone_number}</Typography>
                        <Typography variant="body1" gutterBottom>
                            Invoice Type: 
                            {isEditingInvoiceType ? (
                                <>
                                    <Select value={updatingInvoiceType} onChange={(e) => setUpdatingInvoiceType(e.target.value)}>
                                        <MenuItem value="" disabled>Select Option</MenuItem>
                                        <MenuItem value="default">Default</MenuItem>
                                        <MenuItem value="daily">Daily</MenuItem>
                                        <MenuItem value="weekly">Weekly</MenuItem>
                                        <MenuItem value="monthly">Monthly</MenuItem>
                                    </Select>
                                    <IconButton 
                                        onClick={handleSubmit}
                                        sx={{ color: 'green' }} // Reduced margin
                                        disabled={updatingInvoiceType === contact.invoice_type}
                                    >
                                        {
                                            isSubmiting ? (
                                                <CircularProgress/>
                                            ) : (
                                                <CheckCircleIcon/>
                                            )
                                        }
                                    </IconButton>
                                </>
                            ) : (
                                <>
                                    {contact.invoice_type.charAt(0).toUpperCase() + contact.invoice_type.slice(1)}
                                    <IconButton onClick={() => setIsEditingInvoiceType(true)}>
                                        <EditIcon/>
                                    </IconButton>
                                </>
                            )}
                        </Typography>
                        <Typography variant="body2" gutterBottom component="div">Players:</Typography>
                        {contact.players && contact.players.map((player, index) => (
                            <PlayerComponent key={index} player={player} />
                        ))}
                    </Box>
                </Collapse>
            </Paper>
            <Modal open={isCreatePlayerOn} onClose={() => setIsCreatePlayerOn(false)}>
                <CreatePlayer contactId={contact.contact_id} setOpen={setIsCreatePlayerOn} setContainerOpen={setOpen} fetchData={fetchData}/>
            </Modal>
        </Box>
    );
}

export default function PlayerPage() {
    const [contactData, setContactData] = useState([]);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [contactsLoading, setContactsLoading] = useState(true);

    const fetchData = async (rerender=true) => {
        if (rerender) {
            setContactsLoading(true);
        }
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
