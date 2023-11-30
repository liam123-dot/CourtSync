import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import axios from 'axios';
import {usePopup} from '../Notifications/PopupContext'

import {Spinner} from "../Spinner";

function epochToDateTime(epochSeconds) {
    // Create a new Date object with the epoch multiplied by 1000
    const date = new Date(epochSeconds * 1000);

    // Format the date and time
    const dateString = date.toLocaleDateString('en-US'); // Adjust format as needed
    const timeString = date.toLocaleTimeString('en-US'); // Adjust format as needed

    // Combine both date and time into one string
    return `${dateString} ${timeString}`;
}

export default function CancelBookingPage () {

    const {bookingHash} = useParams();
    const [isLoading, setIsLoading] = useState(false);
    const [invalidHash, setInvalidHash] = useState(false);

    const [bookingData, setBookingData] = useState(false);

    const [cancellationNote, setCancellationNote] = useState(null);

    const [cancellationLoading, setCancellationLoading] = useState(false);

    const [showMessage, setShowMessage] = useState(null)

    const {showPopup} = usePopup();

    useEffect(() => {

        const fetchBooking = async () => {
            
            setIsLoading(true);

            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/player-bookings/${bookingHash}`)

                const data = response.data;
                
                setBookingData(data);

            } catch (error) {

                console.log(error)
                console.log(error.response)
                console.log(error.response.data)
                console.log(error.response.data.message)

                if (error.response.data.message === 'Lesson Already Cancelled') {
                    setShowMessage('This lesson has already been cancelled')
                    setInvalidHash(false);
                } else {
                    setInvalidHash(true);
                }

            }

            setIsLoading(false)

        }

        fetchBooking();

    }, [])

    const confirmCancel = async () => {
        setCancellationLoading(true);

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/timetable/player-bookings/${bookingHash}/cancel`, {
                messageToCoach: cancellationNote
            })

            console.log(response);
            showPopup('Success')

        } catch (error) {
    
            console.log(error)

        }
        setCancellationLoading(false);

    }

    return isLoading ? (
        <div>
            loading
        </div>
    ): invalidHash ? (
        <div>
            Invalid Hash
        </div>
    ) : showMessage ? (
        <div>
            {showMessage}
        </div>
    ): (
        <div>

            <h2>
                Booking Details
            </h2>
            
            <p><b>Player Name:</b> {bookingData.player_name}</p>    
            <p><b>Start Time:</b> {epochToDateTime(bookingData.start_time)}</p>
            <p><b>Duration:</b> {bookingData.duration} minutes</p>
            <p><b>Cost:</b> £{(bookingData.cost / 100).toFixed(2)}</p>
            <p>Please write a note to your coach explaining reason for cancelling:</p>
            <input value={cancellationNote} onChange={(e) => {setCancellationNote(e.target.value)}}/>
            <button onClick={confirmCancel}>
                {cancellationLoading ? <Spinner/>: 'Confirm Cancellation'}
                </button>

        </div>
    )

}