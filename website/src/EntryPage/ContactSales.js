import React, { useState } from 'react';
import axios from 'axios';
import { usePopup } from '../Notifications/PopupContext';

export default function ContactSales() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [message, setMessage] = useState('');

    const [errorMessage, setErrorMessage] = useState(null);

    const { showPopup } = usePopup();

    const handleSubmit = async (event) => {
        event.preventDefault();
    
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact-sales`, { 
                firstName, lastName, email, phoneNumber, message 
            });
            console.log(response.data);
            setErrorMessage(null);
            showPopup('Success');
            window.location.href = process.env.REACT_APP_WEBSITE_URL; // Navigate to the website URL
        } catch (error) {
            console.error("Error submitting enquiry", error);
            setErrorMessage(error.response.data.error);
        }
    };

    const formStyle = {

        display: 'flex',
        flexDirection: 'column',
        maxWidth: '500px',
        margin: '0 auto',
        padding: '20px',
        boxSizing: 'border-box'
    };

    const labelStyle = {
        marginBottom: '10px'
    };

    const inputStyle = {
        padding: '10px',
        marginBottom: '20px',
        border: '1px solid #ddd',
        borderRadius: '4px'
    };

    const buttonStyle = {
        padding: '10px 20px',
        border: 'none',
        borderRadius: '4px',
        backgroundColor: '#007bff',
        color: 'white',
        cursor: 'pointer'
    };

    return (
        <form onSubmit={handleSubmit} style={formStyle}>
            <label style={labelStyle}>
                First Name:
                <input 
                    type="text" 
                    value={firstName} 
                    onChange={e => setFirstName(e.target.value)} 
                    style={inputStyle} 
                />
            </label>
            <label style={labelStyle}>
                Last Name:
                <input 
                    type="text" 
                    value={lastName} 
                    onChange={e => setLastName(e.target.value)} 
                    style={inputStyle} 
                />
            </label>
            <label style={labelStyle}>
                Email:
                <input 
                    type="email" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    style={inputStyle} 
                />
            </label>
            <label style={labelStyle}>
                Phone Number:
                <input 
                    type="tel" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)} 
                    style={inputStyle} 
                />
            </label>
            <label style={labelStyle}>
                Message:
                <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    style={{ ...inputStyle, height: '100px' }} 
                />
            </label>

            {errorMessage && <p style={{ color: 'red' }}>{errorMessage}</p>}

            <input type="submit" value="Submit" style={buttonStyle} />
        </form>
    );
}
