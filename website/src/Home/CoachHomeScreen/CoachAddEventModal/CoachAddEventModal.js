import React, { useState, useEffect } from 'react';
import { ModalOverlay, ModalContent } from "../../Calendar/ModalStyles";
import styled from '@emotion/styled';
import CoachAddLesson from './CoachAddLesson';
import CoachAddEvent from './CoachAddEvent';

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

const OptionButton = styled.button`
  background-color: ${props => props.selected ? 'blue' : ''};
  color: ${props => props.selected ? 'white' : ''};
`;

  const hhmmToMinutes = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  const minutesToHHMM = (minutes) => {
    if (minutes === null || minutes === undefined) {
        return null;  // Or any other default value
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  const hoursString = hours.toString().padStart(2, '0');
  const minutesString = remainingMinutes.toString().padStart(2, '0');

  return `${hoursString}:${minutesString}`;
}

export default function CoachAddEventModal({ isOpen, onClose, loadedDates, all, durations, fetchTimetableData, min, max }) {

  const [selectedDate, setSelectedDate] = useState();
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedEndTime, setSelectedEndTime] = useState(null);
  const [selectedOption, setSelectedOption] = useState('other');

  if (!isOpen) return;

  const handleStartTimeChange = (e) => {
    const value = e.target.value;
    setSelectedStartTime(value);
    console.log(value)
  }

  const handleEndTimeChange = (e) => {
    const value = e.target.value;
    setSelectedEndTime(value);
  }

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>

        <div style={{
            display: 'flex',
            flexDirection: 'column'
        }}>

          <div>
            <OptionButton selected={selectedOption === 'lesson'} onClick={() => setSelectedOption('lesson')}>
              Lesson
            </OptionButton>
            <OptionButton selected={selectedOption === 'other'} onClick={() => setSelectedOption('other')}>
              Other
            </OptionButton>
          </div>

          {
            selectedOption === 'lesson' ? (
              <CoachAddLesson/>
            ): (
              <CoachAddEvent closeModal={onClose}/>
            )
          }

        </div>

      </ModalContent>
    </ModalOverlay>
  );
}
