import React, { useState, useEffect, createContext } from 'react';
import axios from 'axios';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Button from '@mui/material/Button';
import InvoiceTable from './InvoiceTable';
import { Backdrop, CircularProgress, useMediaQuery, useTheme } from '@mui/material';

export const InvoiceDataContext = createContext(null);

export default function InvoicePage() {
    const [view, setView] = useState('daily');
    const [statusView, setStatusView] = useState('upcoming'); // ['completed', 'pending']
    const [data, setData] = useState([]);

    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isInvoicesLoading, setIsInvoicesLoading] = useState(false);

    const [invoicesInitialised, setInvoicesInitialised] = useState(false);

    const [playerSelected, setPlayerSelected] = useState(null);
    
    const theme = useTheme();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));    

    // Fetch invoice data
    const fetchInvoiceData = async (view, statusView, contactEmail = null, limit = 50, offset = 0) => {
        setIsInvoicesLoading(true);
        setData([]);
        try {
            let url = `${process.env.REACT_APP_API_URL}/invoices?frequency=${view}&status=${statusView}`;

            if (contactEmail) {
                url += `&contact_email=${contactEmail}`;
            }

            url += `&limit=${limit}&offset=${offset}`;

            const response = await axios.get(url, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });

            setData(response.data.invoices);
        } catch (error) {
            console.error(error);
        } finally {
            setIsInvoicesLoading(false);
        }
    };

    // Fetch coach invoice status
    const getCoachInvoiceStatus = async () => {
        setIsInitialLoad(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/invoices/status`, {
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });
            const data = response.data;
            setView(data.invoice_type);
            setInvoicesInitialised(data.invoices_initialised);
        } catch (error) {
            console.error(error);
        } finally {
            setIsInitialLoad(false);
        }
    };

    // Initial data load effect
    useEffect(() => {
        const start = async () => {
            await getCoachInvoiceStatus();
            await fetchInvoiceData(view, statusView, playerSelected);
        };

        start();
    }, []);

    // Fetch data when dependencies change
    useEffect(() => {
        fetchInvoiceData(view, statusView, playerSelected);
    }, [view, statusView, playerSelected]);

    // Handle tab change
    const handleTabChange = (event, newValue) => {
        setStatusView(newValue);
    };

    const calculateNextInvoiceDate = () => {
        const today = new Date();
        const day = today.getDay();
        const date = today.getDate();
        const month = today.getMonth();
        const year = today.getFullYear();
    
        let nextInvoiceDate = new Date(year, month, date);
    
        if (view === 'daily') {
            nextInvoiceDate.setDate(date + 1);
        } else if (view === 'weekly') {
            const daysUntilNextMonday = (7 - day + 1) % 7;
            nextInvoiceDate.setDate(date + daysUntilNextMonday);
        } else if (view === 'monthly') {
            nextInvoiceDate.setMonth(month + 1);
            nextInvoiceDate.setDate(1);
        }
    
        return nextInvoiceDate;
    }

    return !isInitialLoad ? (
        invoicesInitialised ? (
            <Box sx={{ borderTop: '4px solid #000', width: '100%', height: '100%', display: 'flex' }}>
                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                            <Tabs 
                                value={statusView} 
                                onChange={handleTabChange} 
                                aria-label="Invoice Status Tabs"
                                variant={isSmallScreen ? "scrollable" : "standard"}
                                scrollButtons={isSmallScreen ? "auto" : false}
                            >
                                <Tab value="completed" label="Completed" />
                                <Tab value="pending" label="Pending" />
                                <Tab value="upcoming" label="Upcoming" />
                            </Tabs>
                        </Box>
                    {
                        statusView === 'upcoming' && (
                            <Box bgcolor="primary.main" color="primary.contrastText" p={2} borderRadius={3}>
                                <Typography 
                                        variant={isSmallScreen ? 'body1' : 'h6'} 
                                        align="center"
                                >
                                    Invoices to be sent on {calculateNextInvoiceDate().toLocaleDateString()}
                                </Typography>
                            </Box>
                        )
                    }
                    <InvoiceDataContext.Provider value={{ fetchInvoiceData, view, statusView }}>
                        <InvoiceTable data={data} />
                    </InvoiceDataContext.Provider>
                </Box>
            </Box>
        ) : (
            <Box>
                <Typography variant="h1">Set up your invoicing preferences</Typography>
                <Typography>
                    Before you can view your invoices, you must set up your invoice details.
                </Typography>
                <Button onClick={() => window.location.href = `${process.env.REACT_APP_WEBSITE_URL}/#/dashboard/settings?tab=invoicing`}>
                    Set up invoices
                </Button>
            </Box>
        )        
    ): (
        <CircularProgress />
    )
}
