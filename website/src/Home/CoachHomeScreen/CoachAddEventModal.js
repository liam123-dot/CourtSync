import React, { useState, useEffect } from 'react';
import { ModalOverlay, ModalContent } from "../Calendar/ModalStyles";
import styled from '@emotion/styled';
import ChooseDateTimeComponent from '../ChooseDateTimeComponent';

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

const dateToString = (date) => {
  if (date){
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}

export default function CoachAddEventModal({ isOpen, onClose, loadedDates, all, durations, fetchTimetableData, min, max }) {

  const [selectedDate, setSelectedDate] = useState();
  const [selectedStartTime, setSelectedStartTime] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  if (!isOpen) return;


  const setDate = () => {

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

          <ChooseDateTimeComponent
            fetchTimetableData={fetchTimetableData}
            durations={durations}
            all={all}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            startTime={selectedStartTime}
            setStartTime={setSelectedStartTime}
            duration={selectedDuration}
            setDuration={setSelectedDuration}
            loadedDates={loadedDates}
            coachSlug={''}
          />

          {
            selectedOption === 'lesson' ? (
              <></>
            ): (
              <>
              
                <Label>
                  Description
                  <InputField type='text'/>
                </Label>

              </>
            )
          }

        </div>

      </ModalContent>
    </ModalOverlay>
  );
}
