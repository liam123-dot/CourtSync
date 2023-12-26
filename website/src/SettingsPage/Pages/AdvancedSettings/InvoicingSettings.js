import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Box, Typography, Button, CircularProgress, FormControl, InputLabel, Select, MenuItem, Backdrop } from '@mui/material';
import { usePopup } from '../../../Notifications/PopupContext';
import { useSettingsLabels } from '../../SettingsPage2';

export default function InvoicingSettings() {
    const [hasStripeAccount, setHasStripeAccount] = useState(false);
    const [accountFullySetup, setAccountFullySetup] = useState(false);
    const [isLoading, setIsLoading] = useState({ save: false, setup: false });
    const [isInitialLoading, setIsInitialLoading] = useState(true); // TODO: use this to show a loading spinner
    const [invoiceType, setInvoiceType] = useState('');
    const [showBackdrop, setShowBackdrop] = useState(false);

    const { showPopup } = usePopup();
    const { refreshLabels } = useSettingsLabels();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me`, {
                    headers: { 'Authorization': localStorage.getItem('AccessToken') }
                });
                const data = response.data;
                setHasStripeAccount(data.stripe_account);
                setInvoiceType(data.invoice_type || '');
                setAccountFullySetup(data.stripe_account_set_up);
                setIsInitialLoading(false);
            } catch (error) {
                console.error(error);
            }
            setIsInitialLoading(false);
        };

        fetchData();
        refreshLabels();
    }, []);

    const handleSave = async () => {
        setIsLoading(prev => ({ ...prev, save: true }));
        try {
            await axios.put(`${process.env.REACT_APP_API_URL}/user/me`, { invoice_type: invoiceType }, {
                headers: { 'Authorization': localStorage.getItem('AccessToken') }
            });
            showPopup('Success');
            refreshLabels();
        } catch (error) {
            console.error(error);
        }
        setIsLoading(prev => ({ ...prev, save: false }));
    };

    const handleStripeSetup = async () => {
        setIsLoading(prev => ({ ...prev, setup: true }));
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/stripe-account`, {}, {
                headers: { 'Authorization': localStorage.getItem('AccessToken') }
            });
            window.location.href = response.data.url;
        } catch (error) {
            console.error(error);
        }
        setIsLoading(prev => ({ ...prev, setup: false }));
    };

    const generateLink = async () => {

        try {

        setShowBackdrop(true)

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/user/stripe-account/generate-link`, {}, {
                headers: { 'Authorization': localStorage.getItem('AccessToken') }
            });
            
            console.log(response)
            window.location.href = response.data.url;

        } catch (error) {
            showPopup(error.response.data.error)
            console.error(error);
        }
        setShowBackdrop(false)

    }

    if (isInitialLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress color='inherit'/>
            </Box>
        );
    }

    return (
        <Box sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
                Configure your invoicing settings.
            </Typography>

            {!hasStripeAccount && !invoiceType && (
                <Typography color="error">
                    <strong>Connect a Stripe account and set invoice regularity to enable invoicing.</strong>
                </Typography>
            )}
            <Box sx={{display: 'flex', flexDirection: 'column', mt: 2}}>

                {!hasStripeAccount && (
                    <Box>
                        <Typography sx={{ mt: 2 }}>
                            Set up a stripe account so you can get paid
                        </Typography>
                        <Button variant="contained" onClick={handleStripeSetup} sx={{ mt: 2 }}>                        
                            {isLoading.setup ? <CircularProgress color='inherit'/> : 'Set up Stripe Account'}
                        </Button>
                    </Box>
                )}
            </Box>

            {hasStripeAccount && accountFullySetup && (
                <Typography sx={{ mt: 2 }}>
                    <a href="https://stripe.com/gb">Manage your Stripe account</a>
                </Typography>
            )}
            {
                hasStripeAccount && !accountFullySetup && (
                    <Box>
                        <Typography sx={{ mt: 2 }}>
                            Attention is required to finish the setup of your Stripe account. This is required to send invoices and get paid.
                        </Typography>
                        <Button onClick={generateLink}>
                            Click here to finish setting up your Stripe account
                        </Button>
                    </Box>
                )
            }

            <FormControl fullWidth margin="normal">
                How often would you like invoices to be sent:
                <Select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                    <MenuItem value="" disabled>Select Option</MenuItem>
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
            </FormControl>
            <Button variant="contained" onClick={handleSave} sx={{ mt: 2, maxWidth: '250px' }}>
                {isLoading.save ? <CircularProgress size={24} /> : 'Save'}
            </Button>

            <Backdrop open={showBackdrop} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    );
}
