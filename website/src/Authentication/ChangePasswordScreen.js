import React, { useState } from "react";
import styled from '@emotion/styled';
import axios from "axios";
import { SaveButton } from "../Home/CommonAttributes/SaveButton";
import { usePopup } from "../Notifications/PopupContext";

const Container = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
`;

const StyledInput = styled.input`
    font-size: 16px;
    padding: 8px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    width: 100%;
`;

const StyledButton = styled.button`
    background-color: #4CAF50;
    color: white;
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-top: 10px;

    &:hover {
        background-color: #45a049;
    }
`;

export default function ChangePasswordScreen({}) {
    const [show, setShow] = useState(false);
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const {showPopup} = usePopup();

    const handleChangePassword = async () => {
        
        try {

            if (newPassword !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }

            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/coach/change-password`,
                {
                    previousPassword: oldPassword,
                    proposedPassword: newPassword,
                },
                {
                    headers: {
                        Authorization: localStorage.getItem("AccessToken"),
                    },
                    
                }
            );

            console.log(response)

            showPopup("Password changed successfully");
            setShow(false);
            setOldPassword("");
            setNewPassword("");
            setConfirmPassword("");

        } catch (error) {
            console.log(error);
            alert(error.response.data.message);
        }

    };

    return show ? (
        <Container>
            <StyledInput
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Old Password"
            />
            <StyledInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
            />
            <StyledInput
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm New Password"
            />
            <StyledButton onClick={handleChangePassword}>Submit</StyledButton>
        </Container>
    ) : (
        <Container>
            <SaveButton onClick={() => setShow(true)}>Change Password</SaveButton>
        </Container>
    );
}