import { ModalContent, ModalOverlay } from "../Calendar/ModalStyles";
import WorkingHoursSettings from "../../SettingsPage/Pages/AdvancedSettings/WorkingHours";

export default function WorkingHoursModal ({isOpen, onClose}) {

    if (!isOpen) {
        return;
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
                <WorkingHoursSettings />
                <button onClick={() => {
                    onClose();
                }}>
                    Cancel
                </button>
            </ModalContent>
        </ModalOverlay>
    )

}
