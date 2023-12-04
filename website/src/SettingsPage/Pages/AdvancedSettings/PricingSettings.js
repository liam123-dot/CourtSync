import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { SaveButton } from '../../../Home/CommonAttributes/SaveButton';
import { Spinner } from '../../../Spinner';
import { usePopup } from '../../../Notifications/PopupContext';

export default function CostInput() {

    const [price, setPrice] = useState(''); // Store the price as a string
    const [isSaving, setIsSaving] = useState(false);

    const { showPopup } = usePopup();

    const handlePriceChange = (e) => {
        const value = e.target.value;

        // Check if the input is a valid number or decimal
        if (!/^(\d+\.?\d*|\.\d+)$/.test(value) && value !== '') {
            return;
        }

        setPrice(value); // Store the price as a string
    };

    useEffect(() => {

        const getPrice = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/features/hourly-rate`,
                    {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    });
                console.log(response.data);
                setPrice(response.data.hourly_rate / 100);
            } catch (error) {
                console.error(error);
            }
        }

        getPrice();

    }, []);

    const handleSave = async () => {

        setIsSaving(true);

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/features`,
                {
                    default_lesson_cost: price * 100
                },
                {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                }
            )

            showPopup('Success');

        } catch (error) {
            console.error(error);
        }

        setIsSaving(false);

    }

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
            <SaveButton onClick={handleSave}>
                {isSaving ? <Spinner /> : 'Save'}
            </SaveButton>
        </div>
    );
}