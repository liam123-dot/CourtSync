import React, { useEffect, useState } from 'react';

export default function DateSelector({fromDate, setFromDate, toDate, setToDate}) {

    const [formattedDate, setFormattedDate] = useState('');
    const [isDatePickerOpen, setDatePickerOpen] = useState(false);

    const updateFormattedDate = () => {
        if (!fromDate || !toDate) return;

        const formatSingleDate = (date) => {
            return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })}`;
        }

        let formattedRange;
        if (fromDate.toDateString() === toDate.toDateString()) {
            formattedRange = formatSingleDate(fromDate);
        } else if (fromDate.getMonth() === toDate.getMonth()) {
            formattedRange = `${fromDate.getDate()} - ${formatSingleDate(toDate)}`;
        } else {
            formattedRange = `${formatSingleDate(fromDate)} - ${formatSingleDate(toDate)}`;
        }
        setFormattedDate(formattedRange);
    }

    useEffect(() => {
        updateFormattedDate();
    }, [fromDate, toDate]);

    const handleDateClick = () => {
        setDatePickerOpen(!isDatePickerOpen);
    }

    const updateDate = (event) => {
        setFromDate(new Date(event.target.value));
    } 

    return (
        <div style={{
            zIndex: 100,
        }}>
            <h2 onClick={handleDateClick}>{formattedDate}</h2>
            {isDatePickerOpen && (
                <input
                    type="date"
                    style={{position: 'absolute', top: '-9999px'}}
                    onFocus={() => setDatePickerOpen(true)}
                    onBlur={() => setDatePickerOpen(false)}
                    onChange={updateDate}
                />
            )}
        </div>
    );
}