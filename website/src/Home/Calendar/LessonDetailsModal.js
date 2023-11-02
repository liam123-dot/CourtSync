import React, {useState} from "react";
import {ModalOverlay, ModalContent} from "./ModalStyles";
import axios from "axios";

export default function LessonDetailsModal({isOpen, onClose, booking}){

    const [onCancelProcess, setOnCancelProcess] = useState(false);
    const [passedConfirmation, setPassedConfirmation] = useState(false);
    const [cancellationNote, setCancellationNote] = useState('');

    if (!isOpen) return;

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

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

            close();

            console.log(response);

        } catch (error){
            console.log(error);
        }

    }

    const close = () => {
        setOnCancelProcess(false);
        setPassedConfirmation(false);
        onClose()
    }

    return (
        <ModalOverlay onClick={close}>
            <ModalContent onClick={(e) => e.stopPropagation()}>

                {onCancelProcess ? (
                    <>

                        {passedConfirmation ? (
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
                        )}

                    </>
                ): 
                    <>
            
                        <h3>Booking Details</h3>
                        <p><strong>Player Name:</strong> {booking.player_name}</p>
                        <p><strong>Contact Name:</strong> {booking.contact_name ? booking.contact_name: 'Player is contact'}</p>
                        <p><strong>Contact Email:</strong> {booking.contact_email}</p>
                        <p><strong>Contact Phone Number:</strong> {booking.contact_phone_number}</p>
                        <p><strong>Cost:</strong> £{booking.cost}</p>
                        <p><strong>Duration:</strong> {booking.duration} minutes</p>
                        <p><strong>Start Time:</strong> {formatTime(booking.start_time)}</p>
                        <p><strong>End Time:</strong> {formatTime(booking.start_time + booking.duration)}</p>
                        <p><strong>Status:</strong> {booking.status || 'N/A'}</p>

                        <button onClick={() => {
                            setOnCancelProcess(true);
                        }}>
                            Cancel
                        </button>
                        <button onClick={() => {
                            
                        }}>Edit</button>

                    </>

                }

            </ModalContent>
        </ModalOverlay>
    )

}
