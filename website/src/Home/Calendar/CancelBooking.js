import React, { useEffect, useState } from "react";
import axios from "axios";
import { useBookingCancellation } from "../CoachHomeScreen/BookingContextProvider";

export default function CancelBooking ({booking, close, onCancelProcess, setOnCancelProcess}) {
    
    const { setBookings } = useBookingCancellation();

    const [passedConfirmation, setPassedConfirmation] = useState(false);
    const [cancellationNote, setCancellationNote] = useState('');

    const cancelLesson = async () => {

        try {

            const response = await axios.post(
                `${process.env.REACT_APP_URL}/timetable/booking/${booking.booking_id}/cancel`,
                {
                    message_to_player: cancellationNote
                }, {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            )

            setPassedConfirmation(false);
            if (setBookings) {
                setBookings(prevBookings => {
                    // Create a new state object
                    const newBookings = { ...prevBookings };
                    
                    Object.keys(prevBookings).forEach((date) => {
                        // Map through the array of bookings for each date and create a new array
                        newBookings[date] = prevBookings[date].map((localBooking) => {
                            // If the booking id matches, return a new object with the status updated to 'cancelled'
                            if (booking.booking_id === localBooking.booking_id){
                                console.log(booking);
                                return { ...localBooking, status: 'cancelled' };
                            }
                            // Otherwise, return the booking as is
                            return localBooking;
                        });
                    });
                    
                    // Return the new state
                    return newBookings;
                });
                
            } else {
                console.log('undefined')
                console.log(setBookings)
            }
            close();

            // console.log(response);

        } catch (error){
            console.log(error);
        }

    }

    useEffect(() => {

        setPassedConfirmation(false);
        setCancellationNote('');

    }, [onCancelProcess]);

    return passedConfirmation ? (
        <>
            <h2>Note to player: </h2>
            <input value={cancellationNote} onChange={(e) => {
                setCancellationNote(e.target.value)
            }}/>
            <button onClick={cancelLesson}>Cancel</button>
        </>
    ): (
        <div>
                                
            <h2>Are you sure you want to cancel</h2>
            <div>
                <button onClick={() => setPassedConfirmation(true)}>Yes</button>
                <button onClick={() => setOnCancelProcess(false)}>No</button>
            </div>

        </div>
    )

}
