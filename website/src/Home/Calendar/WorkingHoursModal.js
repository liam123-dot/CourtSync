import React, {useEffect, useState} from "react";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import {css} from "@emotion/react";
import {ModalOverlay, ModalContent} from "./ModalStyles"
import axios from "axios";

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

export default function WorkingHoursModal({ isOpen, onClose, workingHours, setWorkingHours }) {
    const [localWorkingHours, setLocalWorkingHours] = useState(workingHours);

    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

    useEffect(() => {
        if (isOpen) {
            setLocalWorkingHours(workingHours);
        }
    }, [isOpen, workingHours]);
    
    if (!isOpen) return null;

    const saveWorkingHours = () => {

        const updateWorkingHoursRequest = async () => {

            const url = `${process.env.REACT_APP_URL}/timetable/working-hours`

            const headers = {
                'Authorization': await localStorage.getItem('AccessToken'),
            }

            try{

            const response = await axios.post(url, {working_hours: workingHours}, { headers: headers });

            console.log(response)

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

        }

        setWorkingHours(localWorkingHours);
        updateWorkingHoursRequest();
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
                    {daysOfWeek.map((day, index) => (
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
                    ))}
                    </tbody>
                </table>
                <SaveButton onClick={saveWorkingHours}>Save</SaveButton>
            </ModalContent>
        </ModalOverlay>
    );
}