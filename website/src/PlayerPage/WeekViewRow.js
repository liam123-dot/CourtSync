import React from "react";
import { Button } from "./Button";

export default function WeekViewRow ({data}) {
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
                {data.player_name}
            </div>
            <div style={columnStyle}>
                {data.count}
            </div>
            <div style={columnStyle}>
                £{data.sum}
            </div>

            <Button>
                Send Invoice
            </Button>

        </div>
    );

}
