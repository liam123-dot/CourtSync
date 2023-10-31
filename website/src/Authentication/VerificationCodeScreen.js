import React, { useState } from 'react';
import axios from 'axios';
import { Container, Form, Input, Button, titleStyle, Spinner } from './styles';
import {useLocation, useNavigate} from "react-router-dom";

function VerificationScreen() {
    const [verificationCode, setVerificationCode] = useState('');
    const [verificationCodeErrorMessage, setVerificationCodeErrorMessage] = useState(null);
    const [verificationCodeLoading, setVerificationCodeLoading] = useState(false);
    const [resendCodeLoading, setResendCodeLoading] = useState(false);

    const navigate = useNavigate();

    const location = useLocation();
    const email = location.state.email;
    // ... (other states and functions)

    const handleVerification = async (e) => {
        e.preventDefault();
        setVerificationCodeLoading(true);
        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/auth/coach/confirm`, {
                email: email,
                confirmation_code: verificationCode,
            });
            console.log(response.data);
            setVerificationCodeErrorMessage(null); // Clear any previous error messages
            navigate('/coach/signin')
        } catch (error) {
            if (error.response) {
                // Extract the server's response error message
                const message = error.response.data.message || "An error occurred.";
                setVerificationCodeErrorMessage(message);
            } else {
                setVerificationCodeErrorMessage("An error occurred while making the request.");
            }
            console.error("Error during sign up:", error);
        } finally {
            setVerificationCodeLoading(false);
        }

    };

    const handleResendCode = async (e) => {
        e.preventDefault();

        setResendCodeLoading(true);

        try {
            const response = await axios.post(`${process.env.REACT_APP_URL}/auth/coach/confirm/resend`, {
                email: email
            })
            console.log(response);
        } catch (error){
            console.log(error);
        }

        setResendCodeLoading(false);

    }

    return (
        <Container>
            <h1 css={titleStyle}>Verify Your Account</h1>
            <Form>
                <p>Check your email for the verification code.</p>
                {verificationCodeErrorMessage && <div style={{ color: 'red', marginBottom: '10px' }}>{verificationCodeErrorMessage}</div>}
                <Input value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder="Verification Code" />
                <Button onClick={handleVerification}>
                    {verificationCodeLoading ? <Spinner/>: "Verify"}
                </Button>
                <div style={{
                    marginTop: 1
                }}>
                    <Button onClick={handleResendCode}>
                        {resendCodeLoading ? <Spinner /> : "Resend Code"}
                    </Button>
                </div>
            </Form>
        </Container>
    );
}

export default VerificationScreen;
