import React, {useEffect, useState} from "react";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import {css} from "@emotion/react";
import {ModalOverlay, ModalContent} from "./ModalStyles"
import axios from "axios";
import { Spinner } from "../../Spinner";

const TimeLabel = styled.label`
  margin-right: 15px; // Increased margin
  display: inline-block;
  width: 50px; // Fixed width for alignment
`;

const SaveButton = styled.button`
  background-color: #007BFF;
  color: white;
  padding: 15px 30px; // Bigger padding
  border: none;
  border-radius: 8px; // Bigger border-radius
  cursor: pointer;
  font-size: 18px; // Bigger font size
  align-self: flex-end;
  margin-top: 25px; // Increased margin
  &:hover {
    background-color: #0056b3;
  }
`;

function convertUnixToMinutes(unixTime) {
    const date = new Date(unixTime * 1000);
    return date.getUTCHours() * 60 + date.getUTCMinutes();
}
  
function getWeekdayFromDate(dateStr) {
    const [day, month, year] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    let dayOfWeek = date.getUTCDay() - 1; // Convert so that 0 is Monday
    if (dayOfWeek < 0) { // Adjust Sunday from -1 to 6
      dayOfWeek = 6;
    }
    return dayOfWeek; // Now returns 0 for Monday through 6 for Sunday
}  

function checkAvailability(workingHours, bookings) {
    for (const [date, dailyBookings] of Object.entries(bookings)) {
        const bookingDay = getWeekdayFromDate(date);
        const workHours = workingHours[bookingDay] || {};
        const workStart = workHours.start_time || 0;
        const workEnd = workHours.end_time || 1440; // Default end time to latest possible (1440 minutes)
    
        // Check for any booking that is not within the working hours
        const hasOverlap = dailyBookings.some((booking) => {
            const startMinutes = convertUnixToMinutes(booking.start_time);
            const duration = booking.duration;
            // If a booking starts before work hours or ends after work hours, return true
            return startMinutes < workStart || startMinutes + duration > workEnd;
        });

        // If any overlap is found, return false for the entire function
        if (hasOverlap) {
            return false;
        }
    }
  
    // If no overlaps are found after checking all bookings, return true
    return true;
}
  

export default function WorkingHoursModal({ isOpen, onClose, workingHours, redo, bookings }) {
    const [localWorkingHours, setLocalWorkingHours] = useState({
        0: {'start_time': null, 'end_time': null},
        1: {'start_time': null, 'end_time': null},
        2: {'start_time': null, 'end_time': null},
        3: {'start_time': null, 'end_time': null},
        4: {'start_time': null, 'end_time': null},
        5: {'start_time': null, 'end_time': null},
        6: {'start_time': null, 'end_time': null}
    });
    const [warningRequired, setWarningRequired] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    useEffect(() => {
        if (isOpen) {
            if (Object.keys(workingHours).length > 0){
                setLocalWorkingHours(workingHours);
            }
        }
    }, [isOpen, workingHours]);
    
    if (!isOpen) return null;

    const saveWorkingHours = () => {        

        const updateWorkingHoursRequest = async () => {

            setIsLoading(true);

            const url = `${process.env.REACT_APP_URL}/timetable/working-hours`

            const headers = {
                'Authorization': localStorage.getItem('AccessToken'),
            }

            try{
                console.log(localWorkingHours)

                const response = await axios.post(url, {working_hours: localWorkingHours}, { headers: headers });

                redo();

            } catch (error) {

                console.log(error)
                const errorResponse = error.response;
                console.log(errorResponse)
                const statusCode = errorResponse.statusCode;
                if (statusCode === 404) {

                    // Show invalid url error
                    console.log('not found')

                }
            }

            setIsLoading(false);

        }

        const free = checkAvailability(workingHours, bookings);
        if (free) {
            setWarningRequired(false);
            updateWorkingHoursRequest();
        } else {
            setWarningRequired(true);
        }
    }

    const handleTimeChange = (dayIndex, timeType, value) => {
        const updatedHours = { ...localWorkingHours };
    
        if (!value) {
            updatedHours[dayIndex][timeType] = null;
        } else if(timeType === 'start_time' || timeType === 'end_time') {
            updatedHours[dayIndex][timeType] = hhmmToMinutes(value);
        } else {
            updatedHours[dayIndex][timeType] = value;
        }
        
        setLocalWorkingHours(updatedHours);
    };
    
    const minutesToHHMM = (minutes) => {
        if (minutes === null || minutes === undefined) {
            return "";  // Or any other default value
        }
    
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        
        const hoursString = hours.toString().padStart(2, '0');
        const minutesString = remainingMinutes.toString().padStart(2, '0');
    
        return `${hoursString}:${minutesString}`;
    }

    const hhmmToMinutes = (timeString) => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <h1 css={css`font-size: 24px; margin-bottom: 20px;`}>Adjust your working hours</h1>
                <p css={css`margin-bottom: 20px;`}>Please enter the start and end time for each day:</p>
                <table css={css`width: 100%; text-align: left; font-size: 20px`}>
                    <thead>
                    <tr>
                        <th>Day</th>
                        <th>From</th>
                        <th>To</th>
                    </tr>
                    </thead>
                    <tbody>
                    {daysOfWeek.map((day, index) => {
                        return (
                            localWorkingHours && (
                        <tr key={day}>
                            <td css={css`padding: 10px 0;`}>{day}</td>
                            <td css={css`padding: 10px 0;`}>
                                <TimeLabel>
                                    <input
                                        style={{fontSize: '20px'}}
                                        type="time"
                                        value={minutesToHHMM(localWorkingHours[index].start_time)}
                                        onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                                    />
                                </TimeLabel>
                            </td>
                            <td css={css`padding: 10px 0;`}>
                                <TimeLabel>
                                    <input
                                        style={{fontSize: '20px'}}
                                        type="time"
                                        value={minutesToHHMM(localWorkingHours[index].end_time)}
                                        onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                                    />
                                </TimeLabel>
                            </td>
                        </tr>
                            )
                        )
                        })}
                    </tbody>
                </table>
                {warningRequired && (
                    <p>The new working hours cannot overlap with any upcoming lessons</p>
                )}
                <SaveButton onClick={saveWorkingHours}>
                    {isLoading ? <Spinner /> : "Save"}
                </SaveButton>
            </ModalContent>
        </ModalOverlay>
    );
}