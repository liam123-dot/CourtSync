import React, {useState, useEffect} from "react";
import {Button} from "./Button"
import DayViewRow from "./DayViewRow";
import WeekViewRow from "./WeekViewRow";
import MonthViewRow from "./MonthViewRow";

import axios from 'axios';

const fetchInvoiceData = async (view) => {

    try {

        const response = await axios.get(`${process.env.REACT_APP_URL}/invoices?view=${view}`, {
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
    const [data, setData] = useState([]);

    useEffect(() => {

        const initialLoad = async () => {
            const results = await fetchInvoiceData(view);            
            setData(results.data);
        }

        initialLoad();

    }, [] )

    useEffect(() => {
        
        const fetchData = async () => {
            const results = await fetchInvoiceData(view);
            setData(results.data);
        }

        fetchData();

    }, [view])

    return (
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

                    <div>
                    
                        <Button selected={view==='daily'} onClick={() => setView('daily')}>Daily</Button>
                        <Button selected={view==='weekly'} onClick={(() => setView('weekly'))}>Weekly</Button>
                        <Button selected={view==='monthly'} onClick={(() => setView('monthly'))}>Monthly</Button>

                    </div>

                    <div>
                        <Button>Completed</Button>
                        <Button>Pending</Button>
                    </div>
                </div>

                {
                    view === 'daily' && 
                    data.map((invoice) => (                         
                        <DayViewRow data={invoice} key={invoice.booking_id}/>                
                    ))
                }
                {
                    view === 'weekly' &&
                    data.map((invoice) => (
                        <WeekViewRow data={invoice}/>
                    ))
                }
                {
                    view === 'monthly' &&
                    data.map((invoice) => (
                        <MonthViewRow data={invoice}/>
                    ))
                }            

            </div>
        </div>
    )
}