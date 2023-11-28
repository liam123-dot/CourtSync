import React, {useState, useEffect} from "react";
import {Button} from "./Button"
import DayViewRow from "./DayViewRow";
import WeekViewRow from "./WeekViewRow";
import MonthViewRow from "./MonthViewRow";
import Titles from "./Titles";

import axios from 'axios';

const fetchInvoiceData = async (view, statusView, contactPhoneNumber) => {

    try {
        let url = `${process.env.REACT_APP_API_URL}/invoices?view=${view}&statusView=${statusView}`;
        if (contactPhoneNumber !== null) {
            url += `&contactPhoneNumber=${contactPhoneNumber}`;
        }
        const response = await axios.get(url, {
            headers: {
                Authorization: localStorage.getItem('AccessToken')
            }
        });
        return response.data

    } catch (error) {
        console.log(error)
    }

}

export default function InvoicePage () {

    const [view, setView] = useState('daily')
    const [statusView, setStatusView] = useState('pending') // ['completed', 'pending']
    const [data, setData] = useState([]);

    const [invoicesInitialised, setInvoicesInitialised] = useState(false);
    const [invoiceType, setInvoiceType] = useState('')

    const [playerSelected, setPlayerSelected] = useState(null);

    useEffect(() => {

        const initialLoad = async () => {
            const results = await fetchInvoiceData(view, statusView, playerSelected);
            setInvoicesInitialised(results.invoices_initialised); 
            setInvoiceType(results.invoice_type)
            setView(results.invoice_type);
            setData(results.data);
        }

        initialLoad();

    }, [] )

    useEffect(() => {
        
        const fetchData = async () => {
            const results = await fetchInvoiceData(view, statusView, playerSelected);

            setInvoicesInitialised(results.invoices_initialised);

            setData(results.data);
        }

        fetchData();

    }, [view, statusView, playerSelected])



    return invoicesInitialised ? (
        <div style={{
            borderTop: '4px solid #000',
            width: '100%',
            height: '100%',
            display: 'flex',
        }}>
            <div style={{
                flex: 1
            }}>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                                                
                    {playerSelected && 
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center'
                        
                        }}>
                            <h1>{playerSelected}</h1>
                            <button onClick={() => setPlayerSelected(null)}>x</button>
                        </div>
                    }

                    <div>
                        <Button selected={statusView==='completed'} onClick={() => setStatusView('completed')}>Completed</Button>
                        <Button selected={statusView==='pending'} onClick={() => setStatusView('pending')}>Pending</Button>
                        <Button selected={statusView==='upcoming'} onClick={() => setStatusView('upcoming')}>Upcoming</Button>
                    </div>
                </div>

                {
                    view === 'daily' && 
                    <>
                        <Titles titles={['Name', 'Date', 'Start Time', 'End Time', 'Price', 'Court Cost']}/>
                        {
                            data.map((invoice) => (                         
                                <DayViewRow data={invoice} key={invoice.booking_id} setSelectedPlayer={setPlayerSelected}/>                
                            ))
                        }
                    </>
                }
                {
                    view === 'weekly' &&
                    <>
                        <Titles titles={['Name', 'Number Of Lessons', 'Week', 'Total Cost']}/>
                        {
                            data.map((invoice) => (
                                <WeekViewRow data={invoice} key={invoice.booking_id} statusView={statusView} setSelectedPlayer={setPlayerSelected}/>
                            ))
                        }
                    </>
                }
                {
                    view === 'monthly' &&
                    
                        <>
                            <Titles titles={['Name', 'Number Of Lessons', 'Month', 'Total Cost']}/>
                            {
                                data.map((invoice) => (
                                    <MonthViewRow data={invoice} key={invoice.booking_id} statusView={statusView} setSelectedPlayer={setPlayerSelected}/>
                                ))
                            }
                        </>
                    
                }            

            </div>
        </div>
    ): (
        // Screen that says invoice set up must be completed first and provides a link to do so. Nice styling
        <div>
            <h1>Set up your invoicing preferences</h1>
            <p>Before you can view your invoices you must set up your invoice details</p>
            <Button onClick={() => window.location.href = process.env.REACT_APP_WEBSITE_URL + '/settings'}>Set up invoices</Button>
        </div>

    )
}