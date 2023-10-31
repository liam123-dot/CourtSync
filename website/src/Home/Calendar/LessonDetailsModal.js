import React from "react";
import {ModalOverlay, ModalContent} from "./ModalStyles"

export default function LessonDetailsModal({isOpen, onClose, booking}){

    if (!isOpen) return;

    const formatTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      };
    

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
        
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

            </ModalContent>
        </ModalOverlay>
    )

}
