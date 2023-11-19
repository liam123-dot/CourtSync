import React, { useState } from 'react';
import axios from 'axios';
/** @jsxImportSource @emotion/react */
import { Container, Form, Input, Button, titleStyle, Spinner } from './styles';
import { useNavigate } from 'react-router-dom';


export default function SignUpScreen() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirm_password: ''
    });
    const [errors, setErrors] = useState({});

    const [signUpErrorMessage, setSignUpErrorMessage] = useState(null);

    const [signUpLoading, setSignUpLoading] = useState(false);

    const validate = () => {
        let tempErrors = {};

        // Add more validation rules as needed
        if (!formData.first_name) tempErrors.first_name = "First name is required.";
        if (!formData.last_name) tempErrors.last_name = "Last name is required.";
        if (!formData.email) tempErrors.email = "Email is required.";
        if (!formData.phone_number) tempErrors.phone_number = "Phone number is required.";
        if (!formData.password) {
            tempErrors.password = "Password is required.";
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(formData.password)) {
            tempErrors.password = "Password must be at least 8 characters with a lower, upper case letter, number, and special character.";
        }
        if (formData.password !== formData.confirm_password) tempErrors.confirm_password = "Passwords do not match.";

        setErrors(tempErrors);
        return Object.keys(tempErrors).length === 0; // Returns true if no errors
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (validate()) {
            setSignUpLoading(true);
            try {
                const response = await axios.post(`${process.env.REACT_APP_URL}/auth/coach`, formData);
                console.log(response.data);
                setSignUpErrorMessage(null); // Clear any previous error messages
                navigate(
                    '/coach/verify',
                    {state: { email: formData.email }}
                );
            } catch (error) {
                if (error.response) {
                    // Extract the server's response error message
                    const message = error.response.data.message || "An error occurred.";
                    setSignUpErrorMessage(message);
                } else {
                    setSignUpErrorMessage("An error occurred while making the request.");
                }
                console.error("Error during sign up:", error);
            } finally {
                setSignUpLoading(false);
            }
        }
    };



    const handleInputChange = (e) => {
        let value = e.target.value;
        if (e.target.name === 'first_name' || e.target.name === 'last_name') {
            value = value.charAt(0).toUpperCase() + value.slice(1);
        }
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    return (
        <Container>
            <h1 css={titleStyle}>Coach Sign Up</h1>
            {signUpErrorMessage && <div style={{ color: 'red', marginBottom: '10px' }}>{signUpErrorMessage}</div>}
            <Form onSubmit={handleSubmit}>
                <Input name="first_name" value={formData.first_name} placeholder="First Name" onChange={handleInputChange} />
                {errors.first_name && <div style={{ color: 'red' }}>{errors.first_name}</div>}
                <Input name="last_name" value={formData.last_name} placeholder="Last Name" onChange={handleInputChange} />
                {errors.last_name && <div style={{ color: 'red' }}>{errors.last_name}</div>}
                <Input name="email" placeholder="Email" onChange={handleInputChange} />
                {errors.email && <div style={{ color: 'red' }}>{errors.email}</div>}
                <Input name="phone_number" placeholder="Phone Number" onChange={handleInputChange} />
                {errors.phone_number && <div style={{ color: 'red' }}>{errors.phone_number}</div>}
                <Input type="password" name="password" placeholder="Password" onChange={handleInputChange} />
                {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}
                <Input type="password" name="confirm_password" placeholder="Confirm Password" onChange={handleInputChange} />
                {errors.confirm_password && <div style={{ color: 'red' }}>{errors.confirm_password}</div>}
                <Button type="submit">
                    {signUpLoading ? <Spinner /> : "Sign Up"}
                </Button>


            </Form>

        </Container>
    );

}
