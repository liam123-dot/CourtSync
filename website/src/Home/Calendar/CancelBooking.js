import React, { useEffect, useState } from "react";
import axios from "axios";

export default function CancelBooking ({booking, close, onCancelProcess, setOnCancelProcess}) {
    
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
            close();

            console.log(response);

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
