import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

import { Spinner } from '../../../Spinner';
import { SaveButton } from '../../../Home/CommonAttributes/SaveButton';
import { usePopup } from '../../../Notifications/PopupContext';

export default function DurationSelector({refresh}) {

    const [selectedDurations, setSelectedDurations] = useState([]); // [15, 30, 45, 60, 75, 90, 105, 120
    const [showModal, setShowModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const modalRef = useRef(); // Create a ref
    const { showPopup } = usePopup();

    const durations = Array.from({ length: 8 }, (_, index) => (index + 1) * 15);

    const toggleDuration = (duration) => {
        let updatedDurations;
        if (selectedDurations.includes(duration)) {
            updatedDurations = selectedDurations.filter(d => d !== duration);
        } else {
            updatedDurations = [...selectedDurations, duration].sort((a, b) => a - b);
        }
        setSelectedDurations(updatedDurations);
    };

    const getDurations = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/features/durations`,
                {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                });
            console.log(response.data);
            setSelectedDurations(response.data.durations);
        } catch (error) {
            console.error(error);
        }
    };

    // Add an event listener to the document
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                setShowModal(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        getDurations();
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSave = async () => {

        setIsSaving(true);

        try {

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/features`,
                {
                    durations: selectedDurations
                },
                {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                }
            )

            showPopup('Success');
            refresh();

        } catch (error) {
            console.error(error);
        }

        setIsSaving(false);

    }

    return (
        <div>
            <p>Lessons can only last the durations you select</p>
            {showModal && (
                <div ref={modalRef} style={{ border: '1px solid black', padding: '10px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                    {durations.map(duration => (
                        <div key={duration}>
                            <label>
                                <input 
                                    type="checkbox" 
                                    value={duration} 
                                    checked={selectedDurations.includes(duration)}
                                    onChange={() => toggleDuration(duration)}
                                />
                                {duration} minutes
                            </label>
                        </div>
                    ))}
                    <button onClick={() => setShowModal(false)}>Close</button>
                </div>
            )}
            
            <>
                <p>Selected durations: {selectedDurations.join(", ")} minutes</p>
                <button onClick={() => setShowModal(true)}>Edit</button>
            </>

            <SaveButton onClick={handleSave}>
                {isSaving ? <Spinner /> : 'Save'}
            </SaveButton>
        
        </div>
    );
}