import react, {useEffect, useState} from "react";
import { ModalContent, ModalOverlay } from "./ModalStyles";
import ConfirmationPopup from "../../Notifications/ConfirmComponent";
import { useRefreshTimetable } from "../CoachHomeScreen/RefreshTimetableContext";
import axios from "axios";

export default function CoachEventDetailsModal({ isOpen, onClose, coachEvent }) {

    const [showConfirmation, setShowConfirmation] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [cancelRepeats, setCancelRepeats] = useState(false);

    const {refresh} = useRefreshTimetable();

    if (!isOpen) return null;

    const cancelCoachEvent = async () => {

        try {
            console.log('cancelling')
            console.log(coachEvent)
            const response = await axios.delete(`${process.env.REACT_APP_API_URL}/coach-event/${coachEvent.id}?cancel_repeats=${cancelRepeats}`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            
            console.log(response);
            refresh();
            onClose();

        } catch (error) {
            console.log(error);
        }

    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <h3>Coach Event Details</h3>
                <p><strong>Coach Name:</strong> {coachEvent.title}</p>
                <p><strong>Description:</strong> {coachEvent.description}</p>
                <p><strong>Duration:</strong> {coachEvent.duration} minutes</p>
                <p><strong>Start Time:</strong> {coachEvent.formattedStartTime}</p>
                <p><strong>End Time:</strong> {coachEvent.formattedEndTime}</p>                
                {
                    coachEvent.repeat_id && (
                        <div>
                            <p><strong>Repeat Frequency:</strong> {coachEvent.repeatFrequency}</p>
                            <p><strong>Repeat Until:</strong> {coachEvent.repeatUntil}</p>
                        </div>
                    )
                }
                <button onClick={() => {
                    setConfirmationMessage("Are you sure you want to cancel this event?");
                    setShowConfirmation(true);
                    setCancelRepeats(false);
                }}>Cancel</button>

                <button onClick={() => {
                    setConfirmationMessage("Are you sure you want to cancel this event and all future repeats?");
                    setShowConfirmation(true);
                    setCancelRepeats(true);
                }}>Cancel Repeats</button>

                {
                    showConfirmation && (
                        <ConfirmationPopup
                            message={confirmationMessage}
                            onConfirm={() => {
                                setShowConfirmation(false);
                                setConfirmationMessage("");
                                cancelCoachEvent();
                            }}
                            onCancel={() => {
                                setShowConfirmation(false);
                                setConfirmationMessage("");
                            }}
                        />
                    )
                }

            </ModalContent>
        </ModalOverlay>
    );

}
