import { Dialog, Button } from '@mui/material';
import WorkingHoursSettings from "../../SettingsPage/Pages/AdvancedSettings/WorkingHours";
import { useRefreshTimetable } from './RefreshTimetableContext';

export default function WorkingHoursModal ({isOpen, onClose}) {

    const { refresh } = useRefreshTimetable();

    return (
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm" // set the maximum width to 'sm'
            fullWidth // make the dialog full width
            PaperProps={{ // set the minimum and maximum width of the paper
                style: {
                    minWidth: '650px',
                    maxWidth: '40%',
                },
            }}
        >
            <WorkingHoursSettings refreshTimetable={refresh}/>
            <Button onClick={onClose} color="primary">
                Cancel
            </Button>
        </Dialog>
    )
}