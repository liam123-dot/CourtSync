import React, {useEffect, useState} from "react";
import axios from "axios";
import styled from "@emotion/styled";
import CreatePlayer from "./CreatePlayer";
import CreateContact from "./CreateContact";

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

        return (
            <div>
                <div style={{
                    display: "flex",
                    flexDirection: "row",                
                    alignItems: "center",
                    width: "100%",
                    borderRadius: "1px",                            
                }}
                >
                    <StyledLabel>{contact.name}</StyledLabel>
                    <StyledLabel>{contact.email}</StyledLabel>
                    <StyledLabel>{contact.phone_number}</StyledLabel>
                    <button style={{
                        marginRight: "1%",
                    }}
                    onClick={() => {
                        setAddPlayerOpen(!addPlayerOpen)
                        setIsOpen(true)
                    }}
                    >+</button>
                    <div
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <span>&#x25BC;</span> : <span>&#x25B6;</span>}
                    </div>
                </div>
                <div>
                    {isOpen && (
                        <>
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

        return (
            <div>
                            
                <StyledLabel>{player.name}</StyledLabel>
                
            </div>
        )

    }
    
    return (
        <div style={{
            marginTop: "1%",
        }}>

            <button onClick={() => {setIsCreateContactOpen(true)}}>Create new Contact</button>
            
            {isCreateContactOpen && <CreateContact setOpen={setIsCreateContactOpen} fetchData={fetchData}/>}

            {
                contactData && contactData.map((contact) => {
                    return (<ContactComponent contact={contact} />)                
                })
            }    

        </div>
    )
}
