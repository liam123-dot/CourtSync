import React, { useEffect } from "react";
import { fetchInvoiceData } from "./FetchInvoicesSpecificWeek";
import DayViewRow from "./DayViewRow";
import Titles from "./Titles";

export default function WeekViewRow ({data, statusView}) {
    const columnStyle = {
        flex: 1,
        padding: '0 10px', // Added padding for better spacing
    };

    const [formattedDate, setFormattedDate] = React.useState('');
    const [subData, setSubData] = React.useState(null);
    const [isOpen, setIsOpen] = React.useState(false);

    const [year, setYear] = React.useState('');
    const [week, setWeek] = React.useState('');

    // console.log(data)
    const onRowClick = async (contactEmail) => {

        if (isOpen) {
            setIsOpen(false);
        } else {

            setIsOpen(true);
            const data = await fetchInvoiceData(week, null, year, contactEmail, statusView);
            setSubData(data.data);       

        }

    }

    function getWeekDates() {
        const year = data.time_group.toString().slice(0, 4);
        const week = data.time_group.toString().slice(4, 6);
        setYear(year);
        setWeek(week);
        const januaryFirst = new Date(year, 0, 1);
        const days = 2 + (week - 1) * 7 - januaryFirst.getDay();
        const startOfWeek = new Date(year, 0, days);
        const endOfWeek = new Date(year, 0, days + 6);

        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        const formatDayMonth = (date, includeMonth = true) => includeMonth ? `${date.getDate().toString().padStart(2, '0')} ${monthNames[date.getMonth()]}` : date.getDate().toString().padStart(2, '0');

        return `${formatDayMonth(startOfWeek, false)} - ${formatDayMonth(endOfWeek)}`;
    }

    useEffect(() => {
        if (data && data.time_group) {
            setFormattedDate(getWeekDates());
  
            // setYear(year);
            // setWeek(week);
            // const firstDayOfYear = new Date(year, 0, 1);
            // const startDate = new Date(firstDayOfYear);
            // startDate.setDate(firstDayOfYear.getDate() + (week - 1) * 7 - firstDayOfYear.getDay());
            // const endDate = new Date(startDate);
            // endDate.setDate(startDate.getDate() + 6);
            // const formattedDate = `${startDate.getDate()} - ${endDate.getDate()} ${startDate.toLocaleString('default', { month: 'short' })}`;
            // setFormattedDate(formattedDate);
        }
    }, [data.time_group]);

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