import React, { useEffect, useState } from "react";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { css } from "@emotion/react";
import { ModalOverlay, ModalContent } from "../Calendar/ModalStyles";
import { SaveButton } from "../CommonAttributes/SaveButton";
import axios from "axios";
import { Spinner } from "../../Spinner";
import ChooseDateTimeComponent from "../ChooseDateTimeComponent";
import { formatPriceBreakdown } from "../FormatPriceBreakdown";

const Label = styled.label`
  margin-right: 15px;
  display: block; // changed to block to display on new lines
  margin-top: 10px; 
`;

const InputField = styled.input`
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const SelectField = styled.select`
  display: block;
  width: 100%;
  padding: 10px;
  margin-top: 5px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

function formatPriceInPounds(pennies) {
    // Convert pennies to pounds by dividing by 100 and fixing to 2 decimal places
    const pounds = (pennies / 100).toFixed(2);
    // Return the formatted string with the GBP symbol
    return `£${pounds}`;
}


export default function BookLessonModal({ isOpen, onClose, coachSlug, redo }) {

    const [selectedDate, setSelectedDate] = useState();
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('');
    const [lessonCost, setLessonCost] = useState(0);
    const [rules, setRules] = useState([]);
    const [playerName, setPlayerName] = useState(null);
    const [contactName, setContactName] = useState(null);
    const [isSameAsPlayerName, setIsSameAsPlayerName] = useState(false);
    const [contactEmail, setContactEmail] = useState(null);
    const [contactPhoneNumber, setContactPhoneNumber] = useState(null);

    const [possiblePlayerNames, setPossiblePlayerNames] = useState([]); // [ {name: 'John Smith', id: 1}, {name: 'Jane Doe', id: 2}
    const [isNewName, setIsNewName] = useState(false); // [ {name: 'John Smith', id: 1}, {name: 'Jane Doe', id: 2

    const [isLoading, setIsLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState(null);

    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [localEmail, setLocalEmail] = useState(null);

    const [awaitingVerification, setAwaitingVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState(null);

    const handleBooking = async () => {

        setIsLoading(true);

        const getEpochTime = (date, startTime) => {
            const convertTimeToMinutes = (time) => {
                // Split the time by the colon
                const parts = time.split(':');
              
                // Convert hours and minutes to integers
                const hours = parseInt(parts[0], 10);
                const minutes = parseInt(parts[1], 10);
              
                // Convert hours to minutes and add the minutes
                return (hours * 60) + minutes;
              }
            const minutesFromStartOfDay = convertTimeToMinutes(startTime);
            // Clone the date object to avoid modifying the original date
            let dateCopy = new Date(date.getTime());
          
            // Set the time to midnight (start of the day)
            dateCopy.setHours(0, 0, 0, 0);
          
            // Add the minutes to the start of the day
            console.log()
            dateCopy.setMinutes(dateCopy.getMinutes() + minutesFromStartOfDay);
            // Return the epoch time in seconds
            return Math.floor(dateCopy.getTime() / 1000);
        }

        if (!selectedDate) {
            setErrorMessage('Please select a date.');
        } else 
        if (!selectedStartTime) {
            setErrorMessage('Please select a start time.');
        } else 
        if (!selectedDuration) {
            setErrorMessage('Please select a duration.');
        } else 
        if (!playerName || !contactName) {
            setErrorMessage('Please enter the player and contact names.');
        } else 
        if (isSameAsPlayerName && !playerName) {
            setErrorMessage('Please enter the player name.');
        } else 
        if (!contactEmail) {
            setErrorMessage('Please enter a contact email.');
        } else 
        if (!contactPhoneNumber) {
            setErrorMessage('Please enter a contact phone number.');
        } else 
        if (!/^\S+@\S+\.\S+$/.test(contactEmail)) {
            setErrorMessage('Please enter a valid email address.');
        } else 
        if (!/^(\+44\d{10}|0\d{10})$/.test(contactPhoneNumber)) {
            setErrorMessage('Please enter a valid phone number.');
        } else {

            if (contactPhoneNumber.startsWith('+44')){
                contactPhoneNumber.replace('+44', '0')
            }

            const startTime = getEpochTime(selectedDate, selectedStartTime);            

            if (startTime < Date.now() / 1000) {
                setErrorMessage('Cannot book lessons in the past')
            } else {

                const payload = {
                    startTime: selectedStartTime,
                    duration: selectedDuration,
                    playerName: playerName,
                    contactName: contactName,
                    isSameAsPlayerName: isSameAsPlayerName,
                    email: contactEmail,
                    phoneNumber: contactPhoneNumber,
                    cost: lessonCost,
                    rules: rules
                }

                const url = `${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/booking`

                try {
                    const result = await axios.post(url, payload);
                    console.log(result);

                    localStorage.setItem('contactEmail', contactEmail);

                    setSelectedDate(null);
                    setSelectedStartTime(null);
                    setPlayerName(null);
                    setContactName(null);
                    setIsSameAsPlayerName(false);
                    setContactEmail(null);
                    setContactPhoneNumber(null);
                    setLessonCost(null);
                    setRules(null);
                    setErrorMessage('');
                    setIsNewName(false);
                    onClose();
                    redo();

                } catch (error) {
                    console.log(error)
                    const errorResponse = error.response
                    console.log(errorResponse)
                    setErrorMessage(errorResponse.data.message)
                    redo();
                }
            }

        }

        setIsLoading(false);

    }

    useEffect(() => {
        setLocalEmail(localStorage.getItem('contactEmail'));
    },[])

    useEffect(() => {
        
        if (localEmail && contactEmail && localEmail !== contactEmail) {
            setPossiblePlayerNames([]);
        }

    }, [contactEmail])

    useEffect(() => {

        const getPrice = async () => {

            if (selectedDate && selectedStartTime && selectedDuration){
                try {

                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/lesson-cost?startTime=${selectedStartTime}&duration=${selectedDuration}`);

                    setLessonCost(response.data.cost);
                    setRules(response.data.rules);

                } catch (error) {
                    console.log(error);
                }
            }

        }

        getPrice();

    }, [selectedDate, selectedStartTime, selectedDuration, lessonCost]);

    useEffect(() => {

        const getContactDetails = async () => {
            // if contact email exists in local storage, get contact details

            const contactEmail = localStorage.getItem('contactEmail');
            
            if (contactEmail) {
                try {
                    
                    const response = await axios.get(`${process.env.REACT_APP_API_URL}/${coachSlug}/contact/${contactEmail}`);
                    
                    const data = response.data;

                    console.log(data);

                    setContactName(data.name);
                    setContactEmail(data.email);
                    setContactPhoneNumber(data.phone_number);
                    // data.players is an array objects, convert to array of strings from object['name']
                    const playerNames = data.players.map(player => player.name);
                    console.log(playerNames)
                    setPossiblePlayerNames(playerNames);
                    setPlayerName(playerNames[0])

                } catch (error) {
                    console.log(error);
                }
            }
            
        }
        getContactDetails();

    }, [isOpen])
    
    const handlePlayerNameChange = (e) => {
        const name = e.target.value;
        const capitalized = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        setPlayerName(capitalized);
    }
    const handleContactNameChange = (e) => {
        const name = e.target.value;
        const capitalized = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        setContactName(capitalized);
    }
    const handleCheckboxChange = (e) => {
        setIsSameAsPlayerName(e.target.checked);
        if (e.target.checked) {
            // Set contact name to player's name when checkbox is checked
            setContactName(playerName);
        }
    }
    const handleContactEmailChange = (e) => {
        setContactEmail(e.target.value);
    }
    const handleContactPhoneNumber = (e) => {
        setContactPhoneNumber(e.target.value);
    }

    const handleSendVerificationEmail = async () => {

        try{
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/verify-email`, {email: contactEmail});
            console.log(response);
            setAwaitingVerification(true);
        
        } catch (error) {
            console.log(error);
        }

    }

    const handleSubmitVerificationCode = async () => {

        try{
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/confirm-email`, {email: contactEmail, code: verificationCode});
            console.log(response);
            setAwaitingVerification(false);
            setIsEmailVerified(true);
        
        } catch (error) {
            console.log(error);
        }

    }

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <h1 css={css`font-size: 24px; margin-bottom: 20px;`}>Book a Lesson</h1>
                
                Date input
                <ChooseDateTimeComponent
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    setStartTime={setSelectedStartTime}
                    setDuration={setSelectedDuration}
                    />
                <Label>
                    Lesson Cost : {formatPriceInPounds(lessonCost)}
                </Label>

                {formatPriceBreakdown(rules)}

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    {
                        possiblePlayerNames && possiblePlayerNames.length && !isNewName > 0 ? (
                            <Label>
                                Player Name
                                <SelectField
                                    value={playerName}
                                    onChange={(e) => setPlayerName(e.target.value)}
                                >
                                    {possiblePlayerNames.map(name => {
                                        return (
                                            <option value={name}>{name}</option>
                                        )
                                    })}
                                </SelectField>
                            </Label>
                        ) : (
                            <Label>
                                Player Name
                                <InputField 
                                    type="text"
                                    value={playerName}
                                    onChange={handlePlayerNameChange}
                                    placeholder="Enter player's name"
                                />
                            </Label>
                        )
                    }
                    {possiblePlayerNames && possiblePlayerNames.length && (
                        <Label>
                            <input
                                type="checkbox"
                                checked={isNewName}
                                onChange={(e) => setIsNewName(e.target.checked)}
                            />
                            Add New Name
                        </Label>
                        
                    )}
                </div>             
                
                <div>
                    <Label>
                        Contact Name
                        <InputField

                            type="text"
                            value={contactName}
                            onChange={handleContactNameChange}
                            placeholder="Enter contact's name"
                        
                        />
                    </Label>
                    <Label>
                        Same as player name:
                        <input
                            type="checkbox"
                            checked={isSameAsPlayerName}
                            onChange={handleCheckboxChange}
                        />                    
                    </Label>
                </div>

                {/* Email input */}
                <Label>
                    Contact Email
                    <InputField 
                        type="email"
                        value={contactEmail}
                        onChange={handleContactEmailChange}
                        placeholder="Enter email address"
                    />
                </Label>

                {
                    !isEmailVerified && (!localEmail || localEmail !== contactEmail) && (
                        <>
                            <button onClick={handleSendVerificationEmail}>Verify</button>
                            {
                                awaitingVerification && (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Enter 6-digit code"
                                            maxLength="6"
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            />
                                        <button onClick={handleSubmitVerificationCode}>Submit</button>
                                    </>
                                )
                            }
                        </>
                    )
                }

                {/* Phone Number input */}
                <Label>
                    Contact Phone Number
                    <InputField 
                        type="tel"
                        value={contactPhoneNumber}
                        onChange={handleContactPhoneNumber}
                        placeholder="Enter phone number"
                    />
                </Label>
                {/* ... rest of your modal content ... */}
                {errorMessage && (<p>{errorMessage}</p>)}
                <SaveButton onClick={handleBooking} disabled={!(isEmailVerified || (localEmail == contactEmail))}>
                    {isLoading ? <Spinner/>: 'Save'}
                </SaveButton>
            </ModalContent>
        </ModalOverlay>
    );
}