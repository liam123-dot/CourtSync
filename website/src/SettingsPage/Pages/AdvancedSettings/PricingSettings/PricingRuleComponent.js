import React, { useState } from 'react';
import styled from '@emotion/styled';
import axios from 'axios';
import {usePopup} from '../../../../Notifications/PopupContext'
import ConfirmationPopup from '../../../../Notifications/ConfirmComponent';

const StyledPricingRule = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: 10px;
    padding-right: 40px; // Add this line
    border-bottom: 1px solid #e5e5e5;
    background-color: #f8f8f8;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
    margin-bottom: 10px;
    position: relative;
    &:hover {
        background-color: #eaeaea; // Example of hover effect
    }
`;

const StyledParagraph = styled.p`
    margin: 0;
    color: #333;
    font-weight: 500;

    &.rate {
        color: #4CAF50;
    }

    &.type {
        font-style: italic;
    }
`;

const StyledDeleteButton = styled.button`
    display: ${props => props.show ? 'block' : 'none'};
    background: none;
    border: none;
    color: red;
    font-size: 20px;
    cursor: pointer;
    position: absolute;
    right: 10px;
    &:hover {
        color: darkred;
    }
`;

const formatEpochSecondsToHHMM = (time) => {

    let date = new Date(time * 1000)
    let hours = date.getHours()
    let minutes = date.getMinutes()

    if (hours < 10){
        hours = `0${hours}`
    }

    if (minutes < 10){
        minutes = `0${minutes}`
    }

    return `${hours}:${minutes}`

}

const formatDayMinutesToHHMM = (minutes) => {

    let hours = Math.floor(minutes / 60)
    let remainingMinutes = minutes % 60

    if (hours < 10){
        hours = `0${hours}`
    }

    if (remainingMinutes < 10){
        remainingMinutes = `0${remainingMinutes}`
    }

    return `${hours}:${remainingMinutes}`

}

export default function PricingRule({pricingRule, refresh}){
    const [showDelete, setShowDelete] = useState(false);
    const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);
    const { showPopup } = usePopup();

    const confirmDelete = () => {
        setShowConfirmationPopup(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await axios.delete(`${process.env.REACT_APP_API_URL}/pricing-rules/${pricingRule.rule_id}`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });

            refresh();
            showPopup("Pricing rule deleted successfully");
        } catch (error) {
            console.error(error);
        } finally {
            setShowConfirmationPopup(false);
        }
    };

    const formatTimeComponent = () => {
        if (pricingRule.all_day) {
            return "All Day"
        } else {
            if (pricingRule.start_time && pricingRule.end_time) {
                if (pricingRule.period === 'recurring') {
                    return `${formatDayMinutesToHHMM(pricingRule.start_time)} - ${formatDayMinutesToHHMM(pricingRule.end_time)}`
                } else {
                    return `${formatEpochSecondsToHHMM(pricingRule.start_time)} - ${formatEpochSecondsToHHMM(pricingRule.end_time)}`
                }
            } else if (pricingRule.start_time) {
                if (pricingRule.period === 'recurring') {
                    return `${formatDayMinutesToHHMM(pricingRule.start_time)} -`
                } else {
                    return `${formatEpochSecondsToHHMM(pricingRule.start_time)} -`
                }
            } else if (pricingRule.end_time) {
                if (pricingRule.period === 'recurring') {
                    return `- ${formatDayMinutesToHHMM(pricingRule.end_time)}`
                } else {
                    return `- ${formatEpochSecondsToHHMM(pricingRule.end_time)}`
                }
            }
        }
    }

    const formatDateComponent = () => {
        if (pricingRule.period === 'recurring'){
            // days is a list of days of the week, show each one concisely by showing first 2 letters
            let days = pricingRule.days
            let daysString = ""

            for (let i = 0; i < days.length; i++) {
                daysString += days[i].slice(0,2)
                if (i !== days.length - 1) {
                    daysString += ", "
                }
            }

            return daysString   
        } else {
            return formatEpochSecondsToDDMM(pricingRule.start_time)
        }
    }
    const formatEpochSecondsToDDMM = (time) => {
        const date = new Date(time * 1000);
        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are zero-based
        return `${day}/${month}`;
    };

    const formatType = () => {
        if (pricingRule.type === 'hourly'){
            return 'Overrides hourly rate'
        } else {
            return 'Additional charge'
        }
    }

    return (
        <>
            <StyledPricingRule onMouseEnter={() => setShowDelete(true)} onMouseLeave={() => setShowDelete(false)}>
                <StyledParagraph>{pricingRule.label}</StyledParagraph>
                <StyledParagraph>{formatTimeComponent()}</StyledParagraph>
                <StyledParagraph>{formatDateComponent()}</StyledParagraph>
                <StyledParagraph className="rate">£{(pricingRule.rate / 100).toFixed(2)}</StyledParagraph>
                <StyledParagraph className="type">{formatType()}</StyledParagraph>
                <StyledDeleteButton show={showDelete} onClick={confirmDelete}>X</StyledDeleteButton>
            </StyledPricingRule>
            {showConfirmationPopup && (
                <ConfirmationPopup
                    message="Are you sure you want to delete this pricing rule?"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowConfirmationPopup(false)}
                />
            )}
        </>
    )
}
