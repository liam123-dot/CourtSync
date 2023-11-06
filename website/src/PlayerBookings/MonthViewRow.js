import React from "react";
import { Button } from "./Button";

export default function MonthViewRow ({data}) {
    const columnStyle = {
        flex: 1,
        padding: '0 10px', // Added padding for better spacing
    };

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
                {data.bookings_count}
            </div>
            <div style={columnStyle}>
                £{data.total_cost}
            </div>
            <div>
                {data.month}/{data.year}
            </div>

            <Button>
                Send Invoice
            </Button>

        </div>
    );

}
