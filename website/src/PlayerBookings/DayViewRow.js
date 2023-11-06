import React from "react";
import { Button } from "./Button";

export default function DayViewRow({ data }) {
    const columnStyle = {
        flex: 1,
        padding: '0 10px', // Added padding for better spacing
    };

    // Convert epoch to readable date and time (if start_date and start_time are not preformatted)
    const startDate = new Date(data.start_time * 1000).toLocaleDateString('en-GB');
    const startTime = new Date(data.start_time * 1000).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    const endTime = new Date((data.start_time + data.duration * 60) * 1000).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return (
        <div style={{
            borderTop: '1px solid #000',
            display: 'flex',
            alignItems: 'center', // Align items vertically
            padding: '5px 0', // Increase padding for visual comfort
        }}>

            <div style={columnStyle}>
                {data.contact_name}
            </div>
            <div style={columnStyle}>
                {startDate}
            </div>
            <div style={columnStyle}>
                {startTime}
            </div>
            <div style={columnStyle}>
                {endTime}
            </div>
            <div style={columnStyle}>
                £{data.cost}
            </div>

            <Button>
                Send Invoice
            </Button>

        </div>
    );
}
