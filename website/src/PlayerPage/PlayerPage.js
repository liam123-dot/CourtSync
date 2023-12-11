import React, {useEffect, useState} from "react";
import axios from "axios";
import styled from "@emotion/styled";
import CreatePlayer from "./CreatePlayer";
import CreateContact from "./CreateContact";
import ConfirmationPopup from "../Notifications/ConfirmComponent"
import {usePopup} from '../Notifications/PopupContext'

const StyledDeleteButton = styled.button`
    display: ${props => props.show ? 'block' : 'none'};
    background: none;
    border: none;
    color: red;
    font-size: 20px;
    cursor: pointer;
    position: relative;
    right: 10px;
    &:hover {
        color: darkred;
    }
    margin-left: 6px;
`;
const Container = styled.div`
    margin-top: 1%;
    font-family: Arial, sans-serif; // example font
`;

const Header = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    border: 1px solid #ddd;
    padding: 10px;
    border-radius: 5px;
    background-color: #f9f9f9;
`;

const Button = styled.button`
    background-color: #4CAF50; /* Green */
    border: none;
    color: white;
    padding: 10px 15px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 5px;
`;

const Input = styled.input`
    padding: 10px;
    margin: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
`;

const ContactSection = styled.div`
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    padding: 10px;
    margin-top: 10px;
`;
const ContactContainer = styled.div`
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    padding: 10px;
`;

const ContactHeader = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
    padding: 1%;
    cursor: pointer;
`;

const ToggleIndicator = styled.div`
    margin-right: 1%;
`;

const ContactDetails = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    width: 100%;
`;

const EditButton = styled(Button)` // Assuming Button is already defined
    margin-right: 1%;
`;

const PlayerSection = styled(ContactSection)``;

const StyledLabel = styled.p`
    flex: 1;
    margin-right: 10px;
`;
const PlayerContainer = styled.div`
    border-bottom: 1px solid #ddd;
    border-top: 1px solid #ddd;
    padding: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
`;

const PlayerDetails = styled.div`
    flex-grow: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
`;

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

        return (
            <ContactContainer>
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                }}
                onMouseEnter={() => setShowDelete(true)} 
                onMouseLeave={() => setShowDelete(false)}
                >
                    <ContactHeader onClick={() => setIsOpen(!isOpen)}>
                        <ToggleIndicator>
                            {isOpen ? <span>&#x25BC;</span> : <span>&#x25B6;</span>}
                        </ToggleIndicator>
                        <ContactDetails>
                            {!isEditing ? (
                                <>
                                    <StyledLabel>{contact.name}</StyledLabel>
                                    <StyledLabel>{contact.email}</StyledLabel>
                                    <StyledLabel>{contact.phone_number}</StyledLabel>
                                </>
                            ) : (
                                <>
                                    <Input type="text" name="name" value={data.name} onChange={handleInputChange} />
                                    <Input type="text" name="email" value={data.email} onChange={handleInputChange} />
                                    <Input type="text" name="phone_number" value={data.phone_number} onChange={handleInputChange} />
                                </>
                            )}
                        </ContactDetails>
                    </ContactHeader>
                    {!isEditing ? (
                        <EditButton onClick={() => setIsEditing(true)}>Edit</EditButton>
                    ) : (
                        <>
                            <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                            <Button onClick={handleSubmit}>Submit</Button>
                        </>
                    )}
                    <Button onClick={() => { setAddPlayerOpen(!addPlayerOpen); setIsOpen(true); }}>+ Player</Button>
                    <StyledDeleteButton show={showDelete} onClick={handleDelete}>X</StyledDeleteButton>
                </div>
                <PlayerSection>
                    {isOpen && (
                        <>
                            <h4>Players</h4>
                            {contact.players && contact.players.map((player, index) => (
                                <PlayerComponent key={index} player={player} />
                            ))}
                            {addPlayerOpen && <CreatePlayer contactId={contact.contact_id} setOpen={setAddPlayerOpen} fetchData={fetchData} />}
                        </>
                    )}
                </PlayerSection>
            </ContactContainer>
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
    
        return (
            <PlayerContainer onMouseEnter={() => setShowDelete(true)} onMouseLeave={() => setShowDelete(false)}>
                {isEditing ? (
                    <>
                        <Input type="text" name="name" value={data.name} onChange={handleInputChange} />
                        <Button onClick={submitEdit}>Submit</Button>
                    </>
                ) : (
                    <PlayerDetails>
                        <StyledLabel>{player.name}</StyledLabel>
                        <EditButton onClick={toggleEdit}>Edit</EditButton>
                    </PlayerDetails>
                )}
                <StyledDeleteButton show={showDelete} onClick={handleDelete}>X</StyledDeleteButton>
            </PlayerContainer>
        );
    }
    
    return (
        <Container>

            <Header>
                <Button onClick={() => {setIsCreateContactOpen(true)}}>Create new Contact</Button>
                <p>Add details for an individual that you organise lessons with (the person that schedules and pays for lessons), for example the players parent or the player themselves. These details are used to send important lesson information and invoices</p>
            </Header>
            
            {isCreateContactOpen && <CreateContact setOpen={setIsCreateContactOpen} fetchData={fetchData}/>}

            <ContactSection>
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
            }}>
                <h4 style={{flex: 1}}>Contact Name</h4>
                <h4 style={{flex: 1}}>Email</h4>
                <h4 style={{flex: 1}}>Phone Number</h4>
            </div>
                {
                    contactData && contactData.map((contact) => {
                        return (<ContactComponent contact={contact} />)                
                    })
                }    
            </ContactSection>

            {showConfirmationPopup && (
                <ConfirmationPopup
                    message={`Are you sure you want to delete this ${itemToDelete?.type}?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowConfirmationPopup(false)}
                />
            )}

        </Container>
    )
}
