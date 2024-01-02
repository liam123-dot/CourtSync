import React, { useState, useEffect } from 'react';
import axios from 'axios';
/** @jsxImportSource @emotion/react */
import { Container, TextField, Button, CircularProgress, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useParams } from "react-router-dom";


export default function SignUpScreen() {

    const {hash} = useParams();

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        password: '',
        confirm_password: '',
        hash: hash
    });
    const [errors, setErrors] = useState({});

    const [signUpErrorMessage, setSignUpErrorMessage] = useState(null);

    const [signUpLoading, setSignUpLoading] = useState(false);

    const [validHash, setValidHash] = useState(false);

    const validate = () => {
        let tempErrors = {};

        if (!formData.first_name) tempErrors.first_name = "First name is required.";
        else if (/\s/.test(formData.first_name)) tempErrors.first_name = "First name should not contain spaces. Please replace any spaces with a dash.";
        
        if (!formData.last_name) tempErrors.last_name = "Last name is required.";
        else if (/\s/.test(formData.last_name)) tempErrors.last_name = "Last name should not contain spaces. Please replace any spaces with a dash.";
        
        // Add more validation rules as needed
        if (!formData.first_name) tempErrors.first_name = "First name is required.";
        if (!formData.last_name) tempErrors.last_name = "Last name is required.";
        if (!formData.email) tempErrors.email = "Email is required.";
        if (!formData.phone_number) tempErrors.phone_number = "Phone number is required.";
        if (!formData.password) {
            tempErrors.password = "Password is required.";
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
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/coach/sign-up`, formData);
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

    useEffect(() => {
        const checkHash = async () => {
    
            try{
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/sales/verify-hash/${hash}`, {
                    hash: hash
                });
                setValidHash(true);
                const data = response.data;

                console.log(data);

                setFormData({
                    ...formData,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    email: data.email,
                    phone_number: data.phone_number                   
                });
            
            } catch(error) {
                setValidHash(false);
            }
        }
        checkHash();
    }, [])

    return validHash ? (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Coach Sign Up</Typography>
                {signUpErrorMessage && <Typography color="error">{signUpErrorMessage}</Typography>}
                <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
                    <TextField
                        margin="normal"
                        fullWidth
                        name="first_name"
                        label="First Name"
                        type="text"
                        id="first_name"
                        autoComplete="fname"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        error={!!errors.first_name}
                        helperText={errors.first_name}
                        disabled
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        name="last_name"
                        label="Last Name"
                        type="text"
                        id="last_name"
                        autoComplete="lname"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        error={!!errors.last_name}
                        helperText={errors.last_name}
                        disabled
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        name="email"
                        label="Email"
                        type="email"
                        id="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        error={!!errors.email}
                        helperText={errors.email}
                        disabled
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        name="phone_number"
                        label="Phone Number"
                        type="tel"
                        id="phone_number"
                        autoComplete="tel"
                        value={formData.phone_number}
                        onChange={handleInputChange}
                        error={!!errors.phone_number}
                        helperText={errors.phone_number}
                        disabled
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        error={!!errors.password}
                        helperText={errors.password}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        name="confirm_password"
                        label="Confirm Password"
                        type="password"
                        id="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        error={!!errors.confirm_password}
                        helperText={errors.confirm_password}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={signUpLoading}
                    >
                        {signUpLoading ? <CircularProgress size={24} /> : "Sign Up"}
                    </Button>
                </Box>
            </Box>
        </Container>
    ) : (
        <Container maxWidth="xs" style={{ marginTop: '20px' }}>
            <Typography variant="h6" align="center">
                Invalid Hash
            </Typography>
        </Container>
    );
    

}
