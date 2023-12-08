import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRefreshTimetable } from "../CoachHomeScreen/RefreshTimetableContext";

export default function CancelBooking ({booking, close, onCancelProcess, setOnCancelProcess, cancelRepeat}) {

    const {refresh} = useRefreshTimetable();
    
    const [passedConfirmation, setPassedConfirmation] = useState(false);
    const [cancellationNote, setCancellationNote] = useState('');

    const cancelLesson = async () => {

        try {

            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/timetable/booking/${booking.id}/cancel?cancel_repeats=${cancelRepeat}`,
                {
                    message_to_player: cancellationNote
                }, {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            )
            console.log(response);
            refresh();

            setPassedConfirmation(false);
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
            <button onClick={cancelLesson}>Confirm</button>
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
