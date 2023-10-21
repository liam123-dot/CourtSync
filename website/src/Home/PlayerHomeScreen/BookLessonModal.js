import React, { useEffect, useState } from "react";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import { css } from "@emotion/react";
import { ModalOverlay, ModalContent } from "../Calendar/ModalStyles";
import axios from "axios";

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

const SaveButton = styled.button`
  background-color: #007BFF;
  color: white;
  padding: 15px 30px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  align-self: flex-end;
  margin-top: 25px;
  &:hover {
    background-color: #0056b3;
  }
`;

function convertToHHMM(minutes) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    // Convert hours and minutes to strings and ensure they are at least two characters long
    const hoursString = String(hours).padStart(2, '0');
    const minutesString = String(remainingMinutes).padStart(2, '0');

    return `${hoursString}:${minutesString}`;
}

const daysList = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Friday'];

function calculateAvailableStartTimes(workingHours, bookings, durations) {
    console.log(workingHours, bookings, durations)
    const intervals = [];
    const availableSlots = [];
    
    // 1. Convert the working hours into a list of available time slots in 15-minute intervals.
    for (let i = workingHours.start_time; i < workingHours.end_time; i += 15) {
        intervals.push({
            start: i,
            end: i + 15,
            available: true
        });
    }

    // 2. Loop through each booking and mark the slots that are unavailable due to that booking.
    if (bookings){
        for (let booking of bookings) {
            for (let interval of intervals) {
                if (interval.start < booking.start_time + booking.duration && interval.end > booking.start_time) {
                    interval.available = false;
                }
            }
        }
    }

    console.log(intervals)

    // 3. Loop through each time slot in the available times and check if there's a duration that can fit without overlap.
    for (let interval of intervals) {
        if (interval.available) {
            let availableDurations = [];

            for (let duration of durations) {
                let canFit = true;

                for (let j = 0; j < duration; j += 15) {
                    const correspondingInterval = intervals.find(iv => iv.start === interval.start + j);
                    if (!correspondingInterval || !correspondingInterval.available) {
                        canFit = false;
                        break;
                    }
                }

                if (canFit) {
                    availableDurations.push(duration);
                }
            }

            if (availableDurations.length > 0) {
                availableSlots.push({
                    start_time: interval.start,
                    available_durations: availableDurations
                });
            }
        }
    }
    
    return availableSlots;
}


export default function BookLessonModal({ isOpen, onClose, lessonTypes, workingHours, bookings, days }) {
    const [lessonDetails, setLessonDetails] = useState({
        date: "",
        startTime: "",
        duration: "",
        playerName: "",
        email: "",
        phoneNumber: ""
    });
    useEffect(() => {

        

   }, [])

    const availableDates = days;
    const [availableStartTimes, setAvailableStartTimes] = useState([]);
    const [availableDurations, setAvailableDurations] = useState([15, 30, 45, 60]);

    if (!isOpen) return null;

    const handleBooking = async () => {
        console.log(lessonDetails);
        // Logic to handle the booking can be placed here.
    }

    const setDate = e => {

        const day = e.target.value.split(' ')[0]
        console.log(day)
        const dayIndex = daysList.indexOf(day);
        console.log(dayIndex)
        setLessonDetails({...lessonDetails, date: e.target.value})
        setAvailableStartTimes(calculateAvailableStartTimes(workingHours[dayIndex], bookings, availableDurations));

    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <h1 css={css`font-size: 24px; margin-bottom: 20px;`}>Book a Lesson</h1>
                <Label>
                    Date
                    <SelectField 
                        value={lessonDetails.date} 
                        onChange={setDate} 
                    >
                        <option value="" disabled>Select a date</option> {/* added this placeholder option */}
                        {availableDates.map(date => <option key={date} value={date}>{date}</option>)}
                    </SelectField>
                </Label>
                <Label>
                    Start Time
                    <SelectField 
                        value={lessonDetails.startTime} 
                        onChange={(e) => setLessonDetails({...lessonDetails, startTime: e.target.value})}
                        disabled={!lessonDetails.date} 
                    >
                        <option value="" disabled>Select a time</option> {/* added this placeholder option */}
                        {availableStartTimes.map(time => <option key={time} value={time}>{time}</option>)}
                    </SelectField>
                </Label>
                <Label>
                    Duration (minutes)
                    <SelectField 
                        value={lessonDetails.duration} 
                        onChange={(e) => setLessonDetails({...lessonDetails, duration: e.target.value})}
                        disabled={!lessonDetails.startTime}  // Disable this input if 'startTime' is not filled
                    >
                        {availableDurations.map(duration => <option key={duration} value={duration}>{duration} minutes</option>)}
                    </SelectField>
                </Label>
                <Label>
                    Player Name
                    <InputField 
                        type="text" 
                        value={lessonDetails.playerName} 
                        onChange={(e) => setLessonDetails({...lessonDetails, playerName: e.target.value})}
                        disabled={!lessonDetails.duration}  // Disable this input if 'duration' is not filled
                    />
                </Label>
                <Label>
                    Contact Email
                    <InputField 
                        type="email" 
                        value={lessonDetails.email} 
                        onChange={(e) => setLessonDetails({...lessonDetails, email: e.target.value})}
                        disabled={!lessonDetails.playerName}  // Disable this input if 'playerName' is not filled
                    />
                </Label>
                <Label>
                    Contact Phone Number
                    <InputField 
                        type="tel" 
                        value={lessonDetails.phoneNumber} 
                        onChange={(e) => setLessonDetails({...lessonDetails, phoneNumber: e.target.value})}
                        disabled={!lessonDetails.email}  // Disable this input if 'email' is not filled
                    />
                </Label>
                <SaveButton onClick={handleBooking}>Book Lesson</SaveButton>
            </ModalContent>
        </ModalOverlay>
    );
}