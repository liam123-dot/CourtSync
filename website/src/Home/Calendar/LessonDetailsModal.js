import React, {useState} from "react";
import {ModalOverlay, ModalContent} from "./ModalStyles";
import CancelBooking from "./CancelBooking";

export default function LessonDetailsModal({isOpen, onClose, booking}){

    const [onCancelProcess, setOnCancelProcess] = useState(false);
    const [cancelRepeats, setCancelRepeats] = useState(false);

    if (!isOpen) return;

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };

    return (
        <ModalOverlay onClick={() => {
                setOnCancelProcess(false)
                onClose();
            }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>

                {onCancelProcess ? (
                    <CancelBooking
                        booking={booking}
                        close={() => setOnCancelProcess(false)}
                        onCancelProcess={onCancelProcess}
                        setOnCancelProcess={setOnCancelProcess}
                        cancelRepeat={cancelRepeats}
                    />
                ): 
                    <>
            
                        <h3>Booking Details</h3>
                        <p><strong>Player Name:</strong> {booking.player_name}</p>
                        <p><strong>Contact Name:</strong> {booking.contact_name ? booking.contact_name: 'Player is contact'}</p>
                        <p><strong>Contact Email:</strong> {booking.contact_email}</p>
                        <p><strong>Contact Phone Number:</strong> {booking.contact_phone_number}</p>
                        <p><strong>Cost:</strong> £{(booking.cost / 100).toFixed(2)}</p>

                        <p><strong>Duration:</strong> {booking.duration} minutes</p>
                        <p><strong>Start Time:</strong> {formatTime(booking.minutesIntoDay)}</p>
                        <p><strong>End Time:</strong> {formatTime(booking.minutesIntoDay + booking.duration)}</p>
                        <p><strong>Status:</strong> {booking.status || 'N/A'}</p>

                        {
                            booking.repeat_id && (
                                <div>
                                    <p><strong>Repeat Frequency:</strong> {booking.repeatFrequency}</p>
                                    <p><strong>Repeat Until:</strong> {booking.repeatUntil}</p>
                                </div>
                            )
                        }

                        <button onClick={() => {
                            setOnCancelProcess(true);
                            setCancelRepeats(false);
                        }}>
                            Cancel Lesson
                        </button>
                        {booking.repeat_id && (
                            <button onClick={() => {
                                setOnCancelProcess(true);
                                setCancelRepeats(true);
                            }}>
                                Cancel Repeats
                            </button>
                        )}
                        <button onClick={() => {
                            
                        }}>Edit</button>

                    </>

                }

            </ModalContent>
        </ModalOverlay>
    )

}
