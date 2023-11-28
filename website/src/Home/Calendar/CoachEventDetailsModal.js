import react, {useEffect, useState} from "react";
import { ModalContent, ModalOverlay } from "./ModalStyles";

export default function CoachEventDetailsModal({ isOpen, onClose, coachEvent }) {

    if (!isOpen) return null;

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <h3>Coach Event Details</h3>
                <p><strong>Coach Name:</strong> {coachEvent.title}</p>
                <p><strong>Description:</strong> {coachEvent.description}</p>
                <p><strong>Duration:</strong> {coachEvent.duration} minutes</p>
                <p><strong>Start Time:</strong> {coachEvent.formattedStartTime}</p>
                <p><strong>End Time:</strong> {coachEvent.formattedEndTime}</p>                
            </ModalContent>
        </ModalOverlay>
    );

}
