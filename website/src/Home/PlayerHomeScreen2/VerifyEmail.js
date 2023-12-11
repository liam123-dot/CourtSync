import React, { useState } from 'react';
import styled from '@emotion/styled'; 
import axios from 'axios';

// Styled components
const Container = styled.div`
  padding: 20px;
  max-width: 400px;
  margin: auto;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  width: 100%;
  padding: 10px;
  margin: 10px 0;
  background-color: #4A90E2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: #357ABD;
  }
`;

const VerificationComponent = ({setVerified}) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isEmailSubmitted, setEmailSubmitted] = useState(false);

  const handleEmailSubmit = async () => {
    // Add logic to handle email submission here

    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/verify-email`, {
            email: email
            }
        );
    
    } catch (error) {
        // Handle error
        console.log(error);
    }

    setEmailSubmitted(true);
  };

  const handleVerificationSubmit = async () => {
    
    try {
        const response = await axios.post(`${process.env.REACT_APP_API_URL}/contacts/confirm-email`, {
            email: email,
            code: verificationCode
            }
        );

        setVerified(true);

    } catch (error) {
        // Handle error
        console.log(error);
    }

  };

  return (
    <Container>
      {!isEmailSubmitted ? (
        <>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={handleEmailSubmit}>Submit Email</Button>
        </>
      ) : (
        <>
          <Input
            type="text"
            placeholder="Enter verification code"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
          />
          <Button onClick={handleVerificationSubmit}>Submit Verification Code</Button>
        </>
      )}
    </Container>
  );
};

export default VerificationComponent;
