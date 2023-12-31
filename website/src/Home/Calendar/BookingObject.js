import React, { useEffect, useState, useContext } from "react";
import { TimetableEvent } from "./TimetableEvent";
import { calculateTopAndHeight } from "./CalculateTopAndHeight";
import { useLessonDetails } from "./LessonDetailsContext";
import { useShowCancelled } from "../CoachHomeScreen/ShowCancelledContext";

const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};
function convertEpochToDateString(epochSeconds) {
    const date = new Date(epochSeconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
}
export class BookingObject extends TimetableEvent {

    constructor(id, startTime, duration, date, contact_name, contact_email, contact_phone_number, cost, paid, player_name, status, position, width, repeat_id, repeatFrequency, repeatUntil) {
        super(id, startTime, duration, date);

        this.contact_name = contact_name;
        this.contact_email = contact_email;
        this.contact_phone_number = contact_phone_number;
        this.cost = cost;
        this.paid = paid;
        this.player_name = player_name;
        this.status = status;
        this.position = position;
        this.width = width;      

        this.endTime = this.minutesIntoDay + duration;

        this.shown = true;
        
        this.formattedStartTime = formatTime(this.minutesIntoDay);
        this.formattedEndTime = formatTime(this.endTime);

        this.repeat_id = repeat_id;
        this.repeatFrequency = repeatFrequency;
        this.repeatUntil = repeatUntil ? convertEpochToDateString(repeatUntil) : null;

    }

    // Additional methods and properties specific to BookingObject can be added here
}

export default function BookingComponent({columnStartTime, columnEndTime, booking}) {

    const { setBookings, setShown } = useLessonDetails();

    const [top, setTop] = useState(0);
    const [height, setHeight] = useState(0);

    const {showCancelled, setShowCancelled} = useShowCancelled();
    const [isCancelled, setIsCancelled] = useState(false);

    useEffect(() => {

        if (booking.status === 'cancelled') {
                // Use a linear gradient to create diagonal stripes
                setIsCancelled(true);
            }

            const calculatePercents = () => {
                const columnStartTimeMinutes = columnStartTime * 60;
                const columnEndTimeMinutes = columnEndTime * 60;
        
                const percents = calculateTopAndHeight(columnStartTimeMinutes, columnEndTimeMinutes, booking.minutesIntoDay, booking.endTime);
                setTop(percents.top);
                setHeight(percents.height);
                
            };
            calculatePercents();

    }, [columnStartTime, columnEndTime, booking.startTime, booking.endTime, booking.duration, booking])

    if (booking.status === 'cancelled' && !showCancelled) return null;

    return booking.shown && (
    <div style = {{
            position: 'absolute',
            top: `${top}%`,
            left: `${booking.position}%`,
            height: `${height}%`,
            zIndex: 2,
            width: `${booking.width}%`,
            backgroundImage: booking.status === 'cancelled' ? 'repeating-linear-gradient(45deg, #ffcccc, #ffcccc 2px, #ffffff 2px, #ffffff 6px)' : 'none', // Changed from backgroundColor to backgroundImage
            backgroundColor: 'lightblue',
            borderRadius: 10,
            boxSizing: 'border-box',
            border: '1px solid #0099ff',
            color: '#000',
            cursor: 'pointer',
        }}
        onClick={() => {
            setShown(true);
            setBookings(booking);
        }}
        >        
            <div style={{
                    padding: '2px 5px',
                    backgroundColor: '#fff',
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    }}>
                    {booking.formattedStartTime} - {booking.formattedEndTime}
                </div>
                <div style={{
                    padding: '5px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    height: '100%',
                    }}>
                        <div style={{
                            position: 'absolute',
                            textAlign: 'left'
                        }}>
                            <div>{booking.player_name}</div>
                            <div>{booking.duration} Minutes</div>
                        </div>
                    <div style={{
                        position: 'absolute',
                        right: '5px', // Positioned to the right
                        bottom: '5px', // Positioned to the bottom
                        textAlign: 'right',
                    }}>
                </div>
            </div>
        </div>   
    )

}
