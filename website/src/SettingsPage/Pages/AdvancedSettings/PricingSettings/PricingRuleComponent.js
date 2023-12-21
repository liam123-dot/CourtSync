import React, { useState } from 'react';
import axios from 'axios';
import { usePopup } from '../../../../Notifications/PopupContext';
import ConfirmationPopup from '../../../../Notifications/ConfirmComponent';
import { Card, CardContent, Typography, IconButton, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

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
    const [deleteLoading, setDeleteLoading] = useState(false);
    const { showPopup } = usePopup();

    const confirmDelete = () => {
        setShowConfirmationPopup(true);
    };

    const handleConfirmDelete = async () => {
        setDeleteLoading(true);
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
            setDeleteLoading(false);
        }
        setDeleteLoading(false);
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
                daysString += days[i].slice(0,2).toUpperCase()
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
            <Card 
                sx={{ mb: 1, boxShadow: 1, position: 'relative' }}
                onMouseEnter={() => setShowDelete(true)} 
                onMouseLeave={() => setShowDelete(false)}
            >
                <CardContent>
                    <Grid container alignItems="center" justifyContent="space-between">
                        <Grid item xs={2}>
                            <Typography variant="body1">{pricingRule.label}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                            <Typography variant="body1">{formatTimeComponent()}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                            <Typography variant="body1">{formatDateComponent()}</Typography>
                        </Grid>
                        <Grid item xs={2}>
                            <Typography variant="body1" sx={{ color: 'green' }}>£{(pricingRule.rate / 100).toFixed(2)}</Typography>
                        </Grid>
                        <Grid item xs={3}>
                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>{formatType()}</Typography>
                        </Grid>
                        <Grid item xs={1}>
                            <IconButton 
                                onClick={confirmDelete} 
                                sx={{ 
                                    opacity: 1, 
                                    visibility: 'visible' 
                                }}
                            >
                                <DeleteIcon color="error" />
                            </IconButton>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            {showConfirmationPopup && (
                <ConfirmationPopup
                    message="Are you sure you want to delete this pricing rule?"
                    onConfirm={handleConfirmDelete}
                    onCancel={() => setShowConfirmationPopup(false)}
                    isConfirming={deleteLoading}
                />
            )}
        </>
    );
}
