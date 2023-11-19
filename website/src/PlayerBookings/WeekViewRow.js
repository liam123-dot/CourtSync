import React, { useEffect } from "react";
import { fetchInvoiceData } from "./FetchInvoicesSpecificWeek";
import DayViewRow from "./DayViewRow";
import Titles from "./Titles";

export default function WeekViewRow ({data}) {
    const columnStyle = {
        flex: 1,
        padding: '0 10px', // Added padding for better spacing
    };

    const [formattedDate, setFormattedDate] = React.useState('');
    const [subData, setSubData] = React.useState(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const [year, setYear] = React.useState('');
    const [week, setWeek] = React.useState('');

    const onRowClick = async (contactPhoneNumber) => {

        if (isOpen) {
            setIsOpen(false);
        } else {

            setIsOpen(true);
            const data = await fetchInvoiceData(week, null, year, contactPhoneNumber);
            setSubData(data.data);            

        }

    }

    useEffect(() => {
        if (data && data.year_week) {
            const year = data.year_week.toString().slice(0, 4);
            const week = data.year_week.toString().slice(4, 6);
            setYear(year);
            setWeek(week);
            const firstDayOfYear = new Date(year, 0, 1);
            const startDate = new Date(firstDayOfYear.setDate(firstDayOfYear.getDate() + (week - 1) * 7));
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 6);
            const formattedDate = `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })}`;
            setFormattedDate(formattedDate);
        }
    }, [data.year_week]);

    return (
        <div>
            <div 
            style={{
                borderTop: '1px solid #000',
                display: 'flex',
                alignItems: 'center', // Align items vertically
                padding: '5px 0', // Increase padding for visual comfort
                cursor: 'pointer',
            }}
            onClick={() => onRowClick(data.contact_phone_number)}
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