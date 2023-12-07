import React, { useState } from "react";
import axios from "axios";
import { usePopup } from "../Notifications/PopupContext";
import styled from '@emotion/styled';

const ContactContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    border-radius: 5px;
    border: 1px solid #ddd;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 20px auto;
    background: #f9f9f9;
`;

const StyledForm = styled.form`
    width: 100%;
`;

const FormField = styled.div`
    margin-bottom: 15px;
`;

const StyledLabel = styled.label`
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
`;

const StyledInput = styled.input`
    width: 100%;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
    &:focus {
        outline: none;
        border-color: #4CAF50;
    }
`;

const StyledCheckbox = styled(StyledInput)`
    width: auto;
`;

const SubmitButton = styled.input`
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    &:hover {
        background-color: #45a049;
    }
`;

const CancelButton = styled.button`
    padding: 10px 20px;
    margin-top: 10px;
    border-radius: 5px;
    border: 1px solid #ccc;
    background: white;
    cursor: pointer;
    &:hover {
        background: #f0f0f0;
    }
`;


export default function CreateContact({ setOpen, fetchData }) {
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhoneNumber, setContactPhoneNumber] = useState("");
    const [isPlayerICoach, setIsPlayerICoach] = useState(false); // Added state for checkbox

    const { showPopup } = usePopup();

    const submitContact = async () => {
        const names = contactName.split(' ');
        if (names.length < 2) {
          showPopup("Please enter both a first and last name.");
          return;
        }
      
        const capitalizedNames = names.map(
          name => name.charAt(0).toUpperCase() + name.slice(1)
        );
        const fullName = capitalizedNames.join(' ');
              try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/contact`,
                {
                    name: contactName,
                    email: contactEmail,
                    phone_number: contactPhoneNumber,
                    is_player: isPlayerICoach, // Added is_player_i_coach field
                },
                {
                    headers: {
                        Authorization: `${localStorage.getItem("AccessToken")}`,
                    },
                }
            );

            fetchData();
            setOpen(false);
            showPopup("Contact created successfully");
        } catch (error) {
            console.log(error);
        }
    };

    const handleNameChange = (e) => {
        const names = e.target.value.split(' ');
        const capitalizedNames = names.map(
          name => name.charAt(0).toUpperCase() + name.slice(1)
        );
        const fullName = capitalizedNames.join(' ');
        setContactName(fullName);
      };

      return (
        <ContactContainer>
            <StyledForm onSubmit={(e) => e.preventDefault()}>
                <FormField>
                    <StyledLabel>Contact Name:</StyledLabel>
                    <StyledInput
                        type="text"
                        value={contactName}
                        onChange={handleNameChange}
                    />
                </FormField>
                <FormField>
                    <StyledLabel>Contact Email:</StyledLabel>
                    <StyledInput
                        type="text"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                    />
                </FormField>
                <FormField>
                    <StyledLabel>Contact Phone Number:</StyledLabel>
                    <StyledInput
                        type="text"
                        value={contactPhoneNumber}
                        onChange={(e) => setContactPhoneNumber(e.target.value)}
                    />
                </FormField>
                <FormField>
                    <StyledLabel>
                        Is a player:
                        <StyledCheckbox
                            type="checkbox"
                            checked={isPlayerICoach}
                            onChange={(e) => setIsPlayerICoach(e.target.checked)}
                        />
                    </StyledLabel>
                </FormField>
                <SubmitButton type="button" value="Submit" onClick={submitContact} />
            </StyledForm>
            <CancelButton onClick={() => setOpen(false)}>Cancel</CancelButton>
        </ContactContainer>
    );
}