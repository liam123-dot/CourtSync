import React, { useEffect, useState, useRef } from 'react';
import { Spinner } from '../../Spinner';
import axios from "axios";
import { usePopup } from '../../Notifications/PopupContext';
import EditWorkingHours from './EditWorkingHours';

const ButtonStyle = {
    padding: '10px 15px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: 'white',
    cursor: 'pointer',
    borderRadius: '5px',
    marginTop: '20px'
};

function CostInput({ price = '', setPrice }) {
    const handlePriceChange = (e) => {
        const value = e.target.value;

        // Check if the input is a valid number or decimal
        if (!/^(\d+\.?\d*|\.\d+)$/.test(value) && value !== '') {
            return;
        }

        setPrice(value); // Store the price as a string
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

    const [workingHours, setWorkingHours] = useState([]);

    const {showPopup} = usePopup();

    const isSaveDisabled = selectedDurations.length === 0 || !price || price === '0' || price === '0.00';

    console.log(price)

    const handleSave = async () => {
        // verify that the price is a valid number
        if (!/^(\d+\.?\d*|\.\d+)$/.test(price) || price === '') {
            setErrorMessage('Please enter a valid price.');
            return;
        }
            // Rest of your code...
        

        if (isSaveDisabled) {
            setErrorMessage('Please select at least one duration and enter a valid price.');
        
        } else {
            // TODO: Handle save logic here
            setErrorMessage(''); // Clear any error messages            
            
            setIsSaving(true);

            try {

                const priceInPennies = Math.round(parseFloat(price) * 100); // Convert the price to pennies

                const response = await axios.put(
                    `${process.env.REACT_APP_API_URL}/features`, {
                        default_lesson_cost: priceInPennies,
                        durations: selectedDurations,
                        is_update: isUpdate
                    }, {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    }
                )

                showPopup('Success');

            } catch (error){
                console.log(error)
            }

            setIsSaving(false);

            
        }
    };

    useEffect(() => {

        const fetchCurrentFeatures = async () => {

            setIsLoading(true);

            const response = await axios.get(`${process.env.REACT_APP_API_URL}/features`, {
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
            setPrice(data.hourly_rate / 100.0); // Convert the default price to pennies
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
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <CostInput
                        price={price}
                        setPrice={setPrice}
                    />
                </div>
                <EditWorkingHours workingHours={workingHours} setWorkingHours={setWorkingHours}/>
                <button 
                    style={ButtonStyle} 
                    onClick={() => {
                        handleSave();
                    }}
                >
                    {isSaving ? <Spinner/>: 'Save'}
                </button>
                {errorMessage && <p style={{ color: 'red', marginTop: '10px' }}>{errorMessage}</p>}
            </div>
        )
    );    
}

