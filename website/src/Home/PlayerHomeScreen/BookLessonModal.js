import React, { useEffect, useState } from "react";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { css } from "@emotion/react";
import { ModalOverlay, ModalContent } from "../Calendar/ModalStyles";
import { SaveButton } from "../CommonAttributes/SaveButton";
import axios from "axios";
import Timetable from "../Calendar/Timetable";
import { Spinner } from "../../Spinner";

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

function formatDate(date) {
    let day = date.getDate().toString().padStart(2, '0');
    let month = (date.getMonth() + 1).toString().padStart(2, '0'); // January is 0!
    let year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
}

const calculateAvailableStartTimes = (date, durations, workingHoursInput, bookingsInput) => {
    const formattedDate = formatDate(date);
    let workingHours = { start_time: 0, end_time: 24 * 60 }; // Default to full day if not specified
    let bookings = [];

    if (formattedDate in workingHoursInput) {
        workingHours = workingHoursInput[formattedDate];
    }

    if (formattedDate in bookingsInput) {
        bookings = bookingsInput[formattedDate];
    }

    // Convert epoch times to minutes from the start of the day
    const bookedRanges = bookings.map(booking => {
        const startTimeDate = new Date(booking.start_time * 1000);
        const startTime = startTimeDate.getHours() * 60 + startTimeDate.getMinutes();
        return { start: startTime, end: startTime + booking.duration };
    });

    bookedRanges.sort((a, b) => a.start - b.start);

    let availableStartTimes = {};

    // Adjust start_time to the nearest quarter hour if not already at one
    const startAdjustment = workingHours.start_time % 15;
    if (startAdjustment > 0) {
        workingHours.start_time += 15 - startAdjustment;
    }

    const latestPossibleStart = workingHours.end_time - Math.min(...durations);

    for (let time = workingHours.start_time; time <= latestPossibleStart; time += 15) {
        // Filter the durations that can fit into the current start time
        const validDurations = durations.filter(duration => {
            const lessonEnd = time + duration;
            if (lessonEnd > workingHours.end_time) {
                return false;
            }
            return !bookedRanges.some(range => time < range.end && lessonEnd > range.start);
        });

        if (validDurations.length > 0) {
            // Convert start time from minutes to HH:mm format
            const hours = Math.floor(time / 60).toString().padStart(2, '0');
            const minutes = (time % 60).toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}`;

            availableStartTimes[timeString] = validDurations;
        }
    }

    console.log(availableStartTimes);
    return availableStartTimes;
};


export default function BookLessonModal({ isOpen, onClose, workingHours, bookings, pricingRules, durations, coachSlug, loadedDates, fetchData, redo }) {
    const [lessonDetails, setLessonDetails] = useState({
        date: "",
        startTime: "",
        duration: "",
        playerName: "",
        email: "",
        phoneNumber: "",
        ruleId: "",
        cost: ""
    });

    const [selectedDate, setSelectedDate] = useState();
    const [selectedStartTime, setSelectedStartTime] = useState('');
    const [selectedDuration, setSelectedDuration] = useState('');
    const [lessonCost, setLessonCost] = useState(0);
    const [selectedRuleId, setSelectedRuleId] = useState(null);
    const [playerName, setPlayerName] = useState(null);
    const [contactName, setContactName] = useState(null);
    const [isSameAsPlayerName, setIsSameAsPlayerName] = useState(false);
    const [contactEmail, setContactEmail] = useState(null);
    const [contactPhoneNumber, setContactPhoneNumber] = useState(null);

    const [availableStartTimes, setAvailableStartTimes] = useState([]);
    const [isDateValid, setIsDateValid] = useState(true); // New state to track date validity
    const [availableDurations, setAvailableDurations] = useState([]);

    const [isLoading, setIsLoading] = useState(false);

    const [errorMessage, setErrorMessage] = useState(null);

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
        if (!/^\+\d{11,15}$/.test(contactPhoneNumber)) {
            setErrorMessage('Please enter a valid phone number.');
        } else {

            const payload = {
                startTime: getEpochTime(selectedDate, selectedStartTime),
                duration: selectedDuration,
                playerName: playerName,
                contactName: contactName,
                isSameAsPlayerName: isSameAsPlayerName,
                email: contactEmail,
                phoneNumber: contactPhoneNumber,
                cost: lessonCost,
                ruleId: selectedRuleId
            }

            const url = `${process.env.REACT_APP_URL}/timetable/${coachSlug}/booking`

            try {
                const result = await axios.post(url, payload);
                console.log(result);
                onClose();
                redo();
                setSelectedDate(null);
                setSelectedStartTime(null);
                setPlayerName(null);
                setContactName(null);
                setIsSameAsPlayerName(false);
                setContactEmail(null);
                setContactPhoneNumber(null);
                setLessonCost(null);
                setSelectedRuleId(null);
            } catch (error) {
                console.log(error)
                const errorResponse = error.response
                console.log(errorResponse)
                setErrorMessage(errorResponse.data.message)
                redo();
                setSelectedDate(null);
                setSelectedStartTime(null);
                setSelectedDuration(null);
            }

        }

        setIsLoading(false);

    }

    function calculateLessonCost(inputtedDate, startTime, duration) {
        // Convert the start time to epoch time
        const startTimeParts = startTime.split(':').map(part => parseInt(part, 10));
        const lessonStartDate = new Date(inputtedDate.getTime()); // Clone the inputted date object
        lessonStartDate.setHours(startTimeParts[0], startTimeParts[1], 0, 0); // Set hours and minutes for the lesson start time
        const lessonStartEpoch = lessonStartDate.getTime();
      
        // Calculate the end time of the lesson in epoch time
        const lessonEndEpoch = lessonStartEpoch + duration * 60 * 1000; // Convert minutes to milliseconds
      
        // Use the formatDate function to format the inputted date for rule matching
        const formattedDate = formatDate(inputtedDate);
      
        // Find the applicable pricing rule
        let applicableRule = pricingRules['default'] || {}; // Fallback to an empty object if 'default' does not exist
        const dateRules = pricingRules[formattedDate];
      
        if (dateRules) {
          for (const rule of dateRules) {
            // Check if the rule intersects with the booking time
            if (
              (lessonStartEpoch >= rule.start_time && lessonStartEpoch < rule.end_time) ||
              (lessonEndEpoch > rule.start_time && lessonEndEpoch <= rule.end_time) ||
              (lessonStartEpoch <= rule.start_time && lessonEndEpoch >= rule.end_time)
            ) {
              applicableRule = rule;
              break; // Exit the loop once an applicable rule is found
            }
          }
        }
      
        // Calculate the cost based on the applicable rule
        const durationHours = duration / 60; // Convert duration to hours
        const cost = durationHours * applicableRule.hourly_rate;
      
        // Return the applicable rule and the calculated cost
        return {
          rule_id: applicableRule.rule_id,
          cost: cost ? cost.toFixed(2) : "0.00" // Ensure there's a fallback for cost
        };
      }

    const handleStartTimeChange = (e) => {
        const startTime = e.target.value;
        setSelectedStartTime(startTime);
        // Set the available durations for the selected start time
        const durationsForStartTime = availableStartTimes[startTime] || [];
        setAvailableDurations(durationsForStartTime);
        // Reset selected duration
        setSelectedDuration('');
        setLessonCost(0)
    };

    // Function to handle when a duration is selected
    const handleDurationChange = (e) => {
        const duration = e.target.value;
        setSelectedDuration(duration);
        const result = calculateLessonCost(selectedDate, selectedStartTime, duration);
        console.log(result)
        setLessonCost(result.cost);
        setSelectedRuleId(result.rule_id)
    };

   const setDate = async (e) => {
        const date = new Date(e.target.value)

        let workingHoursLocal = workingHours;
        let bookingsLocal = bookings;
        let durationsLocal = durations;

        const formattedDate = formatDate(date);
        if (!loadedDates.includes(formattedDate)){
            const response = await fetchData(date, date);
            workingHoursLocal = response.workingHours;
            bookingsLocal = response.bookings;
            durationsLocal = response.durations;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to the start of today
        setSelectedDate(date);

        // Check if the newDate is before today
        if (date < today) {
            setIsDateValid(false);
            // return
        }
        setIsDateValid(true);

        const startTimes = calculateAvailableStartTimes(date, durationsLocal, workingHoursLocal, bookingsLocal);
        setAvailableStartTimes(startTimes);
        setSelectedStartTime('');
        setSelectedDuration('');
        setLessonCost(0)
    }
    
    const handlePlayerNameChange = (e) => {
        setPlayerName(e.target.value);
    }
    const handleContactNameChange = (e) => {
        setContactName(e.target.value);
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

    // Convert the selectedDate state to a string in the 'YYYY-MM-DD' format
    const dateToString = (date) => {
        if (date){
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        }
    }

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <h1 css={css`font-size: 24px; margin-bottom: 20px;`}>Book a Lesson</h1>
                
                {/* Date input */}
                <Label>
                    Date
                    <InputField 
                        type="date"
                        value={dateToString(selectedDate)} 
                        onChange={setDate}
                    />
                    {!isDateValid && <p css={css`color: red;`}>Please select a valid date (today or in the future).</p>}
                </Label>
                
                {/* Start Time dropdown */}
                <Label>
                    Start Time
                    <SelectField 
                        value={selectedStartTime}
                        onChange={handleStartTimeChange}
                        disabled={Object.keys(availableStartTimes).length === 0}
                    >
                        <option value="">Select a start time</option>
                        {Object.keys(availableStartTimes).map(startTime => (
                            <option key={startTime} value={startTime}>{startTime}</option>
                        ))}
                    </SelectField>
                </Label>
                
                {/* Duration dropdown */}
                <Label>
                    Duration
                    <SelectField 
                        value={selectedDuration}
                        onChange={handleDurationChange}
                        disabled={availableDurations.length === 0}
                    >
                        <option value="">Select a duration</option>
                        {availableDurations.map(duration => (
                            <option key={duration} value={duration}>{duration} minutes</option>
                        ))}
                    </SelectField>
                </Label>
                <Label>
                    Lesson Cost : {lessonCost}
                </Label>
                <Label>
                    Player Name
                    <InputField 
                        type="text"
                        value={playerName}
                        onChange={handlePlayerNameChange}
                        placeholder="Enter player's name"
                    />
                </Label>
                
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
                <SaveButton onClick={handleBooking}>
                    {isLoading ? <Spinner/>: 'Save'}
                </SaveButton>
            </ModalContent>
        </ModalOverlay>
    );
}