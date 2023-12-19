import React, { useState, useEffect } from 'react';
import DaySelector from './DaySelector'; // Assuming this is compatible with MUI
import axios from 'axios';
import { usePopup } from '../../../../Notifications/PopupContext';
import { Container, TextField, Button, Radio, RadioGroup, FormControlLabel, Typography, CircularProgress } from '@mui/material';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';

export default function AddNewPricingRuleComponent({setShown, refresh}) {
    const [ruleType, setRuleType] = useState(null); // 'recurring' or 'one-time'
    const [timeSelection, setTimeSelection] = useState(null); // 'all-day' or 'specific-time' [not used yet
    const [costType, setCostType] = useState(null); // 'extra' or 'hourly'
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null); // Assume this is a Date object

    const [label, setLabel] = useState('');
    const [price, setPrice] = useState(''); // Store the price as a string

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState(''); // Assume this is a Date object

    const [submitLoading, setSubmitLoading] = useState(false);

    const { showPopup } = usePopup();

    useEffect(() => {
        // Reset values when ruleType changes
        setSelectedDays([]);
        setSelectedDate(null);
        setTimeSelection(null);
    }, [ruleType]);

    useEffect(() => {
        // Reset values when timeSelection changes and it's not 'all-day'
        if (timeSelection !== 'all-day') {
            setStartTime('');
            setEndTime('');
        }
    }, [timeSelection]);

    useEffect(() => {
        // Reset values when costType changes
        setLabel('');
        setPrice('');
    }, [costType]);

    const submitPricingRule = async () => {

        setSubmitLoading(true);

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

        setSubmitLoading(false);

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
                Recurs Every:
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

    return (
        <Container sx={{ p: 2, bgcolor: '#f8f8f8', borderRadius: 1, boxShadow: 1, mb: 2 }}>
            {/* Rule Type Selection */}
            <div>
                <RadioGroup row value={ruleType} onChange={(e) => {
                        setRuleType(e.target.value)
                        setSelectedDays([]);
                        setSelectedDate(null);
                    }}>
                    <FormControlLabel value="recurring" control={<Radio />} label="Recurring Rule" />
                    <FormControlLabel value="one-time" control={<Radio />} label="One Time Rule" />
                </RadioGroup>
        
                {ruleType &&
                    <>
                        {/* Recurring or One-Time Options */}
                        {ruleType === 'recurring' ? (
                            // Your custom DaySelector logic here...
                            renderRecurringOptions()
                        ) : ruleType === 'one-time' ? (
                            <DatePicker
                                label="Select Date"
                                value={selectedDate}
                                onChange={(newDate) => setSelectedDate(newDate)}
                                renderInput={(params) => <TextField {...params} />}
                            />
                        ) : null}
        
                        {ruleType && (selectedDays.length > 0 || selectedDate) &&
                            <>
                                {/* All Day Checkbox or Specific Time Selection */}
                                <RadioGroup row value={timeSelection} onChange={(e) => setTimeSelection(e.target.value)}>
                                    <FormControlLabel value="all-day" control={<Radio />} label="All Day" />
                                    <FormControlLabel value="specific-time" control={<Radio />} label="Specific Time" />
                                </RadioGroup>
                            </>
                        }
        
                        {(timeSelection) &&
                            <>
                                {/* Time Inputs */}
                                {timeSelection === 'specific-time' && (
                                    <>
                                        <TimePicker
                                            label="Start Time"
                                            value={startTime}
                                            onChange={(newTime) => setStartTime(newTime)}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                        <TimePicker
                                            label="End Time"
                                            value={endTime}
                                            onChange={(newTime) => setEndTime(newTime)}
                                            renderInput={(params) => <TextField {...params} />}
                                        />
                                    </>
                                )}
        
                                {/* Cost Type Selection */}
                                <RadioGroup row value={costType} onChange={(e) => setCostType(e.target.value)}>
                                    <FormControlLabel value="extra" control={<Radio />} label="Extra Cost - A Fixed cost that is added to lessons that start in this time period" />
                                    <FormControlLabel value="hourly" control={<Radio />} label="Hourly Cost - Cost per hour for lessons that start in this time period" />
                                </RadioGroup>
        
                                {costType && (
                                    <>
                                    {/* Label and Price Inputs */}
                                    <TextField
                                        label="Label *"
                                        type="text"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <TextField
                                        label="Price *"
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        fullWidth
                                        margin="normal"
                                    />
            
                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                                        <Button variant="contained" color="primary" onClick={submitPricingRule}>
                                            {submitLoading ? <CircularProgress color="inherit"/> : 'Save'}                                        </Button>
                                    </div>
                                    </>
                                )}
                            </>
                        }
                    </>
                }
            </div>
            <Button onClick={() => setShown(false)} sx={{ mr: 1 }}>
                Cancel
            </Button>
        </Container>
    );
    
  
    }