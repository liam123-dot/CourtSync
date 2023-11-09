import React, { useState, useEffect } from 'react';
import { ModalOverlay, ModalContent } from "../Calendar/ModalStyles";
import styled from '@emotion/styled';

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

`

const dateToString = (date) => {
  if (date){
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}

export default function CoachAddEventModal({ isOpen, onClose }) {

  const [selectedDate, setSelectedDate] = useState();
  const [selectedStartTime, setSelectedStartTime] = useState(null);

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
                <OptionButton>Lesson</OptionButton>
                <OptionButton>Other</OptionButton>
            </div>

            <Label>

                Date
                <InputField
                  type="date"
                  value={dateToString(selectedDate)}
                  onChange={setDate}
                />

            </Label>

            <Label>

              Start Time
              <InputField

              />

            </Label>

        </div>

      </ModalContent>
    </ModalOverlay>
  );
}
