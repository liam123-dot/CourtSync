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

export default function CoachAddEventModal({ isOpen, onClose}) {

  const [selectedOption, setSelectedOption] = useState('lesson');

  if (!isOpen) {
    return null;
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
