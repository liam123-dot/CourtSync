import React from 'react';
import styled from '@emotion/styled';

// Styled components for the popup
const PopupOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const PopupContainer = styled.div`
    background: white;
    padding: 20px;
    border-radius: 5px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    z-index: 1001;
    text-align: center;
`;

const PopupButton = styled.button`
    margin: 10px;
    padding: 10px 20px;
    border-radius: 5px;
    border: none;
    cursor: pointer;
`;

const ConfirmationPopup = ({ message, onConfirm, onCancel }) => {
    return (
        <PopupOverlay>
            <PopupContainer>
                <p>{message}</p>
                <PopupButton onClick={onConfirm}>Confirm</PopupButton>
                <PopupButton onClick={onCancel}>Cancel</PopupButton>
            </PopupContainer>
        </PopupOverlay>
    );
};

export default ConfirmationPopup;
