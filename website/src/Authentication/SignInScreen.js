import React, { useState } from 'react';
import axios from 'axios';
/** @jsxImportSource @emotion/react */
import { Container, Form, Input, Button, titleStyle, Spinner } from './styles';

export default function SignInScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const isEmailValid = (email) => {
        // Basic regex for email validation
        const pattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
        return pattern.test(email);
    };

    const isPasswordValid = (password) => {
        return password.length >= 6; // Check if password has at least 6 characters
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null);

        if (!isEmailValid(username)) {
            setErrorMessage("Please enter a valid email.");
            setIsLoading(false);
            return;
        }

        if (!isPasswordValid(password)) {
            setErrorMessage("Password is too short.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/auth/coach/sign-in`, {
                username,
                password
            });

            const data = response.data;
            const authenticationResult = data.AuthenticationResult;
            const AccessToken = authenticationResult.AccessToken;
            const RefreshToken = authenticationResult.RefreshToken;
            const IdentityToken = authenticationResult.IdToken;

            localStorage.setItem('email', username);
            localStorage.setItem('AccessToken', AccessToken);
            localStorage.setItem('RefreshToken', RefreshToken);
            localStorage.setItem('IdentityToken', IdentityToken);



            // Handle successful sign-in (e.g., redirect, store tokens, etc.)
        } catch (error) {
            if (error.response) {
                setErrorMessage(error.response.data.message || "An error occurred.");
            } else {
                setErrorMessage("An error occurred while making the request.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <h1 css={titleStyle}>Coach Sign In</h1>
            {errorMessage && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMessage}</div>}
            <Form onSubmit={handleSubmit}>
                <Input
                    type="text"
                    placeholder="Email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit">
                    {isLoading ? <Spinner /> : "Sign In"}
                </Button>
            </Form>
        </Container>
    );
}
