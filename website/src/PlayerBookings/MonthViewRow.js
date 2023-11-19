import React, { useEffect } from "react";
import DayViewRow from "./DayViewRow";
import { fetchInvoiceData } from "./FetchInvoicesSpecificWeek";
import Titles from "./Titles";

export default function MonthViewRow ({data}) {
    const columnStyle = {
        flex: 1,
        padding: '0 10px', // Added padding for better spacing
    };

    const [subData, setSubData] = React.useState(null);

    const [year, setYear] = React.useState('');
    const [month, setMonth] = React.useState('');

    const [isOpen, setIsOpen] = React.useState(false);

    const onRowClick = async (contactEmail) => {

        if (isOpen) {
            setIsOpen(false);
        } else {

            setIsOpen(true);
            const data = await fetchInvoiceData(null, month, year, contactEmail);
            setSubData(data.data);
        }

    }

    const [formattedDate, setFormattedDate] = React.useState('');

    useEffect(() => {
        if (data && data.year && data.month) {
            const date = new Date(data.year, data.month - 1);
            setYear(data.year);
            setMonth(data.month);
            const formattedDate = `${date.toLocaleString('default', { month: 'long' })} ${data.year}`;
            setFormattedDate(formattedDate);
        }
    }, [data.year, data.month]);

    return (
        <div>
            <div 
                style={{
                    borderTop: '2px solid #000',
                    display: 'flex',
                    alignItems: 'center', // Align items vertically
                    padding: '5px 0', // Increase padding for visual comfort
                    cursor: 'pointer',
                }}
                onClick={() => onRowClick(data.contact_email)}
            >
                <div style={columnStyle}>
                    {data.contact_name}
                </div>
                <div style={columnStyle}>
                    {data.bookings_count}
                </div>
                <div style={columnStyle}>
                    {formattedDate}
                </div>
                <div style={columnStyle}>
                    £{(data.total_cost / 100).toFixed(2)}
                </div>
                <div style={{marginLeft: 'auto'}}>
                    {isOpen ? <span>&#x25BC;</span> : <span>&#x25B6;</span>}
                </div>
            </div>
            {isOpen &&
                <div style={{
                    width: '90%',
                    marginLeft: '10%',
                    marginBottom: '20px',
                }}>
                    <Titles titles={['Date', 'Start Time', 'End Time', 'Cost', 'Court Cost']}/>
                    {subData && subData.map((booking) => <DayViewRow data={booking} subView={true}/>)}
                </div>
            }
        </div>
    );
}