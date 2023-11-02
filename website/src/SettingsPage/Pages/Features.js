import React, { useEffect, useState } from 'react';
import { SaveButton } from '../../Home/CommonAttributes/SaveButton';
import { Spinner } from '../../Spinner';
import axios from "axios";

const ModalStyle = {
    border: '1px solid black',
    padding: '20px',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    boxShadow: '0 0 15px rgba(0, 0, 0, 0.2)',
    background: 'white'
};

const ButtonStyle = {
    padding: '10px 15px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '5px',
    marginTop: '20px'
};

function DurationSelector({selectedDurations, setSelectedDurations}) {
    const [showModal, setShowModal] = useState(false);

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

    return (
        <div>
            {showModal && (
                <div style={{ border: '1px solid black', padding: '10px', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
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
            )
            }
            
            <>
                <p>Selected durations: {selectedDurations.join(", ")} minutes</p>
                <button onClick={() => setShowModal(true)}>Edit</button>
            </>
        
        </div>
    );
}

function CostInput({ price = 0, setPrice }) {
    const [errorMessage, setErrorMessage] = useState('');

    const handlePriceChange = (e) => {
        const value = e.target.value;
        const isValidCurrency = /^\d*(\.\d{0,2})?$/.test(value); // Checks if it's a number and has at most 2 decimal points

        if (!isValidCurrency) {
            setErrorMessage("Please enter a valid price");
        } else {
            setErrorMessage('');
        }

        setPrice(value);
    };

    return (
        <div>
            <p>Lesson Cost per Hour:</p>
            <span>£</span>
            <input
                type="text"
                value={price}
                onChange={handlePriceChange}
                placeholder="0.00"
                style={{ textAlign: 'right' }}
            />
            {errorMessage && <p style={{color: 'red'}}>{errorMessage}</p>}
        </div>
    );
}


export default function FeaturesPage() {
    const [price, setPrice] = useState(null);
    const [selectedDurations, setSelectedDurations] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUpdate, setIsUpdate] = useState(false);

    const isSaveDisabled = selectedDurations.length === 0 || !price || price === '0' || price === '0.00';

    const handleSave = async () => {
        if (isSaveDisabled) {
            setErrorMessage('Please select at least one duration and enter a valid price.');
        
        } else {
            // TODO: Handle save logic here
            setErrorMessage(''); // Clear any error messages            
            
            setIsSaving(true);
            try {

                const response = await axios.post(
                    `${process.env.REACT_APP_URL}/timetable/features`, {
                        default_lesson_cost: price,
                        durations: selectedDurations,
                        is_update: isUpdate
                    }, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    }
                )

                console.log(response);

            } catch (error){
                console.log(error)
            }

            setIsSaving(false);

        }
    };

    useEffect(() => {

        const fetchCurrentFeatures = async () => {

            setIsLoading(true);

            const response = await axios.get(`${process.env.REACT_APP_URL}/timetable/features`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            })

            const data = response.data;

            if (data.durations.length === 0 && data.default_pricing === null){

                setIsUpdate(false);
            } else {

                setIsUpdate(true);
            }

            setSelectedDurations(data.durations);
            setPrice(data.default_pricing)
            setIsLoading(false);

        }

        fetchCurrentFeatures();

    }, [])

    return (
        isLoading ? (
            <div>
                Loading
            </div>
        ) : (
            <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px' }}>
                    <p>Duration Selection: </p>
                    <DurationSelector 
                        selectedDurations={selectedDurations} 
                        setSelectedDurations={setSelectedDurations} 
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <CostInput
                        price={price}
                        setPrice={setPrice}
                    />
                </div>
                <button 
                    style={ButtonStyle} 
                    onClick={handleSave}
                >
                    {isSaving ? <Spinner/>: 'Save'}
                </button>
                {errorMessage && <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>}
            </div>
        )
    );    
}

