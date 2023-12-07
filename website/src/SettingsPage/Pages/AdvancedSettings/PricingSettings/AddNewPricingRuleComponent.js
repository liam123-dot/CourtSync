import React, { useState } from 'react';
import DaySelector from './DaySelector';
import styled from '@emotion/styled';
import axios from 'axios';
import { usePopup } from '../../../../Notifications/PopupContext';

const Container = styled.div`
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
`;

const StyledLabel = styled.label`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  color: #333;
  font-weight: 500;
`;

const StyledInput = styled.input`
  padding: 10px;
  margin-top: 5px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
`;

const StyledButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  &:hover {
    background-color: #45a049;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
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
export default function AddNewPricingRuleComponent({setShown, refresh}) {
    const [ruleType, setRuleType] = useState(null); // 'recurring' or 'one-time'
    const [timeSelection, setTimeSelection] = useState(null); // 'all-day' or 'specific-time' [not used yet
    const [costType, setCostType] = useState('extra'); // 'extra' or 'hourly'
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null); // Assume this is a Date object

    const [label, setLabel] = useState('');
    const [price, setPrice] = useState(''); // Store the price as a string

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState(''); // Assume this is a Date object

    const { showPopup } = usePopup();

    // Utility function to convert Date to string, adjust as needed
    const dateToString = (date) => {
        return date.toISOString().split('T')[0];
    };

    // Function to handle date change
    const setDate = (e) => {
        const value = e.target.value;
        console.log(value);
        console.log(typeof value);
        setSelectedDate(e.target.value);
    };

    const submitPricingRule = async () => {

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/pricing-rules`, {
                is_default: false,
                rate: Number(price * 100),
                label: label,
                start_time: startTime,
                end_time: endTime,
                all_day: timeSelection === 'all-day',
                type: costType,
                period: ruleType,
                days: selectedDays,
                date: selectedDate,
            }, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken'),
                }
            });

            refresh();
            showPopup('Pricing rule added successfully');
            setShown(false);

        } catch (error) {

            console.log(error);

        }

    }

    const handleDaySelection = (day) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    const renderRecurringOptions = () => {
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return (
            <div>
                {daysOfWeek.map(day => (
                    <DaySelector
                        key={day}
                        letter={day.substring(0, 2)}
                        selected={selectedDays.includes(day)}
                        setSelected={() => handleDaySelection(day)}
                    />
                ))}
            </div>
        );
    };
    const renderOneTimeOptions = () => {
        return (
            <input
                type="date"
                value={selectedDate || ''}
                onChange={setDate}
            />
        );
    };

    return (
        <Container>
          {/* Rule Type Selection */}
          <div style={{
            display: 'flex',          
          }}>
            <StyledLabel>
              <StyledInput
                type="radio"
                name="ruleType"
                value="recurring"
                checked={ruleType === 'recurring'}
                onChange={() => setRuleType('recurring')}
              />
              Recurring
            </StyledLabel>
            <StyledLabel>
              <StyledInput
                type="radio"
                name="ruleType"
                value="one-time"
                checked={ruleType === 'one-time'}
                onChange={() => setRuleType('one-time')}
              />
              One Time
            </StyledLabel>
          </div>
    
          {/* Recurring or One-Time Options */}
          {ruleType && (ruleType === 'recurring' ? renderRecurringOptions() : renderOneTimeOptions())}
    
          { ruleType && (<>

          {/* All Day Checkbox */}
          <div style={{
            display: 'flex',          
            flexDirection: 'row',
          }}>
            <StyledLabel>
              <StyledInput
                type="radio"
                checked={timeSelection === 'all-day'}
                onChange={() => setTimeSelection('all-day')}
              />
              All Day
            </StyledLabel>
            <StyledLabel>
              <StyledInput
                type="radio"
                checked={timeSelection === 'specific-time'}
                onChange={() => setTimeSelection('specific-time')}
              />
              Specific Time
            </StyledLabel>
          </div>
    
          {timeSelection && (<>

          {/* Time Inputs */}
          {timeSelection && timeSelection !== 'all-day' && (
            <div>
              <StyledLabel>
                Start Time
                <StyledInput
                  type="time"
                  value={startTime || ''}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </StyledLabel>
              <StyledLabel>
                End Time
                <StyledInput
                  type="time"
                  value={endTime || ''}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </StyledLabel>
            </div>
          )}
    
          {/* Cost Type Selection */}
          <StyledLabel>
            <StyledInput
              type="radio"
              name="costType"
              value="extra"
              checked={costType === 'extra'}
              onChange={() => setCostType('extra')}
            />
            Extra Cost - A Fixed cost that is added to lessons that start in this time period
          </StyledLabel>
          <StyledLabel>          
            <StyledInput
              type="radio"
              name="costType"
              value="hourly"
              checked={costType === 'hourly'}
              onChange={() => setCostType('hourly')}
            />
            Hourly Cost - Cost per hour for lessons that start in this time period
          </StyledLabel>
    
          {/* Label and Price Inputs */}
          <StyledLabel>
            Label - This is what will be shown to users, if the rule applies.
            <InputField
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </StyledLabel>
          <StyledLabel>
            Price
            <InputField
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </StyledLabel>
    
          {/* Action Buttons */}
          <ButtonContainer>
            <StyledButton onClick={() => setShown(false)}>Cancel</StyledButton>
            <StyledButton onClick={submitPricingRule}>Submit</StyledButton>
          </ButtonContainer>
            </>)}
          </>)}
        </Container>
      );
    }