import React, {useEffect, useState} from "react";
import axios from "axios";
import styled from "@emotion/styled";
import CreatePlayer from "./CreatePlayer";
import CreateContact from "./CreateContact";
import {usePopup} from '../Notifications/PopupContext'

const StyledLabel = styled.p`
flex: 1;
`

export default function PlayerPage () {
    
    const [contactData, setContactData] = useState([])
    const [isCreateContactOpen, setIsCreateContactOpen] = useState(false)

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

    useEffect(() => {

        fetchData();

    }, [])

    const ContactComponent = ({contact}) => {

        const [isOpen, setIsOpen] = useState(false);
        const [addPlayerOpen, setAddPlayerOpen] = useState(false);
        const [isEditing, setIsEditing] = useState(false);

        const [data, setData] = useState({});

        const {showPopup} = usePopup();

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

        return (
            <div style={{
                borderTop: "1px solid #000",
                borderBottom: "1px solid #000",
            }}>
                <div style={{
                    display: "flex",
                    flexDirection: "row",                
                    alignItems: "center",
                    width: "100%",
                    borderRadius: "1px",                            
                    
                }}
                >
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            width: "100%",
                            borderRadius: "1px",
                            padding: "1%",
                        }}
                    >
                        <div style={{
                            marginRight: "1%",                    
                        }}>
                            {isOpen ? <span>&#x25BC;</span> : <span>&#x25B6;</span>}
                        </div>
                        {!isEditing ? (
                            <>
                                <StyledLabel>{contact.name}</StyledLabel>
                                <StyledLabel>{contact.email}</StyledLabel>
                                <StyledLabel>{contact.phone_number}</StyledLabel>
                            </>
                        ) : (
                            <>
                            <input type="text" name="name" value={data.name} onChange={handleInputChange} />
                            <input type="text" name="email" value={data.email} onChange={handleInputChange} />
                            <input type="text" name="phone_number" value={data.phone_number} onChange={handleInputChange} />
                            </>
                        )}
                    </div>  

                    {!isEditing && <button onClick={() => {setIsEditing(true)}}>Edit</button>}
                    {isEditing && (
                    <>
                        <button onClick={() => {setIsEditing(false)}}>Cancel</button>
                        <button onClick={handleSubmit}>Submit</button>
                    </>
                    )
                    }
                  <button style={{
                        marginRight: "1%",
                    }}
                    onClick={() => {
                        setAddPlayerOpen(!addPlayerOpen)
                        setIsOpen(true)
                    }}
                    >+ Player</button>
                </div>
                <div>
                    {isOpen && (
                        <>
                        <h4>Players</h4>
                        {
                            contact.players && contact.players.map((player) => {
                                return (<PlayerComponent player={player} />)
                            })
                        }
                        {
                            addPlayerOpen && <CreatePlayer contactId={contact.contact_id} setOpen={setAddPlayerOpen} fetchData={fetchData}/>
                        }
                        </>
                    )}                                            
                </div>
            </div>
        )

    }

    const PlayerComponent = ({player}) => {
        const [data, setData] = useState({});
        const [isEditing, setIsEditing] = useState(false);
        const {showPopup} = usePopup();
    
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
    
        const toggleEdit = () => {
            setIsEditing(!isEditing);
            setData({...data, name: player.name});
        };
    
        return (
            <div style={{
                borderBottom: "1px solid #000",
                borderTop: "1px solid #000",
            }}>
                {isEditing ? (
                    <>
                        <input type="text" name="name" value={data.name} onChange={handleInputChange} />
                        <button onClick={submitEdit}>Submit</button>
                    </>
                ) : (
                    <>
                        <StyledLabel>{player.name}</StyledLabel>
                        <button onClick={toggleEdit}>Edit</button>
                    </>
                )}
            </div>
        );
    }
    
    return (
        <div style={{
            marginTop: "1%",
        }}>

            <div style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                width: "100%",
                borderRadius: "1px",
                border: "1px solid black",
                padding: "1%",
            }}>
                <button onClick={() => {setIsCreateContactOpen(true)}}>Create new Contact</button>
                <p>Add details for an individual that you organise lessons with (the person that schedules and pays for lessons), for example the players parent or the player themselves. These details are used to send important lesson information and invoices</p>
            </div>
            
            {isCreateContactOpen && <CreateContact setOpen={setIsCreateContactOpen} fetchData={fetchData}/>}

            {
                contactData && contactData.map((contact) => {
                    return (<ContactComponent contact={contact} />)                
                })
            }    

        </div>
    )
}
