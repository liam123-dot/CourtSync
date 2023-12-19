import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Box, Typography, TextField, IconButton } from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon, Add as AddIcon } from '@mui/icons-material';
import CreatePlayer from "./CreatePlayer";
import CreateContact from "./CreateContact";
import ConfirmationPopup from "../Notifications/ConfirmComponent";
import { usePopup } from '../Notifications/PopupContext';

export default function PlayerPage () {
    
    const [contactData, setContactData] = useState([])
    const [isCreateContactOpen, setIsCreateContactOpen] = useState(false)
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const {showPopup} = usePopup();

    const fetchData = async () => {

        try {
            
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/contacts`, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            })
            
            setContactData(response.data.contacts)

        } catch (error) {
            console.log(error)
        }

    }

    const confirmDelete = (item) => {
        setShowConfirmationPopup(true);
        setItemToDelete(item);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        try {
            // Assuming the item has 'type' and 'id' properties
            const urlSuffix = itemToDelete.type === 'contact' ? `contact/${itemToDelete.id}` : `player/${itemToDelete.id}`;
            await axios.delete(`${process.env.REACT_APP_API_URL}/${urlSuffix}`, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            });

            fetchData();
            showPopup(`${itemToDelete.type} deleted successfully`);
        } catch (error) {
            console.log(error);
        } finally {
            setShowConfirmationPopup(false);
            setItemToDelete(null);
        }
    };

    useEffect(() => {

        fetchData();

    }, [])

    const ContactComponent = ({contact}) => {

        const [isOpen, setIsOpen] = useState(false);
        const [addPlayerOpen, setAddPlayerOpen] = useState(false);
        const [isEditing, setIsEditing] = useState(false);

        const [showDelete, setShowDelete] = useState(false);

        const [data, setData] = useState({});

        const handleInputChange = (event) => {
            setData({...data, [event.target.name]: event.target.value});
        }

        const handleSubmit = async () => {
            try {
                    
                await axios.put(`${process.env.REACT_APP_API_URL}/contact/${contact.contact_id}`, data, {
                    headers: {
                        Authorization: `${localStorage.getItem("AccessToken")}`,
                    },
                })
                
                setIsEditing(false);
                fetchData();
                showPopup("Contact updated successfully");
            } catch (error) {
                console.log(error)
            }            
        }

        useEffect(() => {
            setData({...data, name: contact.name, email: contact.email, phone_number: contact.phone_number})
        }, [])

        const handleDelete = () => {
            confirmDelete({ type: 'contact', id: contact.contact_id });
        };

        // Removed the IconButton for deleting a contact
        return (
            <Box sx={{ borderBottom: '1px solid #ddd', padding: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                    onMouseEnter={() => setShowDelete(true)} 
                    onMouseLeave={() => setShowDelete(false)}>
                    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'row', alignItems: 'center', cursor: 'pointer' }} onClick={() => setIsOpen(!isOpen)}>
                        {/* Toggle Indicator */}
                        <Typography variant="body1" sx={{ marginRight: 2 }}>{isOpen ? <span>&#x25BC;</span> : <span>&#x25B6;</span>}</Typography>
                        {/* Contact Details */}
                        {!isEditing ? (
                            <>
                                <Typography variant="body1" sx={{ marginRight: 2 }}>{contact.name}</Typography>
                                <Typography variant="body1" sx={{ marginRight: 2 }}>{contact.email}</Typography>
                                <Typography variant="body1">{contact.phone_number}</Typography>
                            </>
                        ) : (
                            <>
                                <TextField name="name" value={data.name} onChange={handleInputChange} />
                                <TextField name="email" value={data.email} onChange={handleInputChange} />
                                <TextField name="phone_number" value={data.phone_number} onChange={handleInputChange} />
                            </>
                        )}
                    </Box>
                    {!isEditing ? (
                        <IconButton onClick={() => setIsEditing(true)}><EditIcon /></IconButton>
                    ) : (
                        <>
                            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSubmit}>Submit</Button>
                        </>
                    )}
                    <Button onClick={() => { setAddPlayerOpen(!addPlayerOpen); setIsOpen(true); }}><AddIcon /></Button>
                </Box>
                {isOpen && (
                    <>
                        <Typography variant="h4">Players</Typography>
                        {contact.players && contact.players.map((player, index) => (
                            <PlayerComponent key={index} player={player} />
                        ))}
                        {addPlayerOpen && <CreatePlayer contactId={contact.contact_id} setOpen={setAddPlayerOpen} fetchData={fetchData} />}
                    </>
                )}
            </Box>
);

    }

    const PlayerComponent = ({player}) => {
        const [data, setData] = useState({});
        const [isEditing, setIsEditing] = useState(false);
        const [showDelete, setShowDelete] = useState(false);
    
        const handleInputChange = (event) => {
            setData({...data, [event.target.name]: event.target.value});
        };
    
        const submitEdit = async () => {
            
            try {
                
                await axios.put(`${process.env.REACT_APP_API_URL}/player/${player.player_id}`, data, {
                    headers: {
                        Authorization: `${localStorage.getItem("AccessToken")}`,
                    },
                })
                
                setIsEditing(false);
                fetchData();
                showPopup("Player updated successfully");
                
            } catch (error) {
                console.log(error)
            }

        };

        const handleDelete = () => {
            confirmDelete({ type: 'player', id: player.player_id });
        };
    
        const toggleEdit = () => {
            setIsEditing(!isEditing);
            setData({...data, name: player.name});
        };
    
        // Removed the IconButton for deleting a player
        return (
            <Box sx={{ borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', padding: 2 }}>
                {isEditing ? (
                    <>
                        <TextField type="text" name="name" value={data.name} onChange={handleInputChange} />
                        <Button onClick={submitEdit}>Submit</Button>
                        <Button onClick={toggleEdit}>Cancel</Button>
                    </>
                ) : (
                    <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body1" sx={{ marginRight: 2 }}>{player.name}</Typography>
                    </Box>
                )}
                {
                    !isEditing &&
                    <IconButton onClick={toggleEdit}>
                        <EditIcon />                   
                    </IconButton>
                }
            </Box>
        );
    }
    
    return (
        <Box sx={{ marginTop: 2, fontFamily: 'Arial, sans-serif' }}>
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', border: 1, borderColor: '#ddd', padding: 1, borderRadius: 1, backgroundColor: '#f9f9f9', marginBottom: 2 }}>
                <Button onClick={() => setIsCreateContactOpen(true)} variant="contained" color="primary" sx={{ marginRight: 2 }}>Create new Contact</Button>
                <Typography>Add details for an individual that you organise lessons with...</Typography>
            </Box>
            
            {isCreateContactOpen && <CreateContact setOpen={setIsCreateContactOpen} fetchData={fetchData}/>}

            {contactData && contactData.length > 0 && (
                <>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                    }}>
                        <Typography variant="h4" sx={{ flex: 1 }}>Contact Name</Typography>
                        <Typography variant="h4" sx={{ flex: 1 }}>Email</Typography>
                        <Typography variant="h4" sx={{ flex: 1 }}>Phone Number</Typography>
                    </div>

                    <Box sx={{ borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd', padding: 2, marginTop: 2 }}>
                        {
                            contactData.map((contact) => <ContactComponent key={contact.contact_id} contact={contact} />)
                        }
                    </Box>
                </>
            )}
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
