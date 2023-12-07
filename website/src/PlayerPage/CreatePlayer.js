import React, {useState} from "react";
import axios from "axios";
import styled from "@emotion/styled";

const Container = styled.div`
    background: #f9f9f9;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: 300px;
    margin: 20px auto;
`;

const StyledForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const StyledLabel = styled.label`
    font-weight: bold;
    margin-bottom: 5px;
`;

const StyledInput = styled.input`
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    &:focus {
        outline: none;
        border-color: #4CAF50;
    }
`;

const SubmitButton = styled(StyledInput)`
    background-color: #4CAF50;
    color: white;
    cursor: pointer;
    &:hover {
        background-color: #45a049;
    }
`;

const CancelButton = styled.button`
    padding: 8px 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    &:hover {
        background: #f0f0f0;
    }
`;


export default function CreatePlayer ({contactId, setOpen, fetchData}) {

    const [playerName, setPlayerName] = useState("");

    const submitPlayer = async (e) => {
        e.preventDefault();
    
        const nameParts = playerName.split(' ');
        if (nameParts.length < 2) {
            alert("Please enter a first name and a surname.");
            return;
        }
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact/${contactId}/player`, {
                name: playerName,
            }, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            })
    
            fetchData();
            setOpen(false);
        } catch (error) {
            console.log(error)
        }
    }

    const handleNameChange = (e) => {
        const value = e.target.value;
        setPlayerName(value.replace(/\b\w/g, char => char.toUpperCase()));
    }

    return (
        <Container>
            <StyledForm onSubmit={submitPlayer}>
                <StyledLabel>
                Player names are used to create lessons and ensure invoices and other important information is sent to the correct place
                </StyledLabel>
                <StyledLabel>
                    Player Name:
                    <StyledInput
                        type="text"
                        value={playerName}
                        onChange={handleNameChange}
                    />
                </StyledLabel>
                <SubmitButton type="submit" value="Submit" />
            </StyledForm>
            <CancelButton onClick={() => setOpen(false)}>Cancel</CancelButton>
        </Container>
    );
}