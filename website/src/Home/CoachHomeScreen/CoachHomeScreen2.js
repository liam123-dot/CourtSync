import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useQuery, useQueryClient } from 'react-query';

import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import momentTimezonePlugin from '@fullcalendar/moment-timezone';
import LessonDetailsModal2 from './LessonDetailsModal2';
import CoachEventDetailsModal from '../Calendar/CoachEventDetailsModal';
import WorkingHoursModal from './WorkingHoursModal';
import { Backdrop, CircularProgress } from '@mui/material';

import { usePopup } from '../../Notifications/PopupContext';
import { RefreshTimetableProvider } from './RefreshTimetableContext';
import CoachAddModal from './CoachAddModal/CoachAddModal';

const fetchTimetable = async ({ queryKey }) => {
    const [_, fromTime, toTime] = queryKey;
    const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable?fromTime=${fromTime}&toTime=${toTime}`, {
        headers: {
            Authorization: localStorage.getItem("AccessToken"),
        },
    })    
    return response.data;
};

export default function CoachHomeScreen2() {
    const [link, setLink] = useState(null);
    const [isLessonDetailsModalOpen, setIsLessonDetailsModalOpen] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [isCoachEventDetailsModalOpen, setIsCoachEventDetailsModalOpen] = useState(false);
    const [selectedCoachEvent, setSelectedCoachEvent] = useState(null);
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
    const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false);
    const [businessHours, setBusinessHours] = useState([]);
    const [headerToolbarConfig, setHeaderToolbarConfig] = useState({});
    const { showPopup } = usePopup();
    const calendarRef = useRef(null);
    const [dateRange, setDateRange] = useState({ start: null, end: null });
    const [showCancelled, setShowCancelled] = useState(false);

    const queryClient = useQueryClient();

    const { data, isLoading, isError, error } = useQuery(
        ['timetable', dateRange.start, dateRange.end],
        fetchTimetable,
        {
            enabled: !!dateRange.start && !!dateRange.end, // Fetch only if dateRange is set
            onSuccess: (data) => {
                setBusinessHours(data.businessHours);
            },
            onError: (error) => {
                console.error(error);
            }
        }
    );

    useEffect(() => {
        const updateToolbarConfig = () => {
            setHeaderToolbarConfig({
                left: 'prev,next today',
                center: 'title',
                right: window.innerWidth < 768 ? 'timeGridDay' : 'timeGridWeek,timeGridDay addEvent workingHours customLink toggleCancelled',
            });
        };

        window.addEventListener('resize', updateToolbarConfig);
        updateToolbarConfig();

        return () => window.removeEventListener('resize', updateToolbarConfig);
    }, []);

    useEffect(() => {
        const getLink = async () => {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/coach_url`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            setLink(response.data.coach_url);
        };

        getLink();
    }, []);

    const handleEventClick = (clickInfo) => {
        const data = clickInfo.event.extendedProps;
        if (data.type === 'booking') {
            setSelectedBooking(data);
            setIsLessonDetailsModalOpen(true);
        } else {
            setSelectedCoachEvent(data);
            setIsCoachEventDetailsModalOpen(true);
        }
    };

    const handleDateRangeChange = (info) => {
        const startTimestamp = new Date(info.start).getTime() / 1000;
        const endTimestamp = new Date(info.end).getTime() / 1000;
        setDateRange({ start: startTimestamp, end: endTimestamp });
    };

    const toggleShowCancelled = () => {
        setShowCancelled(!showCancelled);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(link);
        showPopup("Link copied to clipboard");
    };

    return (
        <>
            <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={isLoading}>
                <CircularProgress color="inherit" />
            </Backdrop>
            <FullCalendar
                height={'100%'}
                plugins={[dayGridPlugin, timeGridPlugin, momentTimezonePlugin]}
                initialView='timeGridWeek'
                firstDay={1}
                events={data?.events || []}
                ref={calendarRef}
                customButtons={{
                    addEvent: {
                        text: '+',
                        click: () => setIsAddEventModalOpen(true),
                    },
                    workingHours: {
                        text: '⚙',
                        click: () => setIsWorkingHoursModalOpen(true),
                    },
                    customLink: {
                        text: 'Link for Players',
                        click: handleCopy,
                    },
                    toggleCancelled: {
                        text: showCancelled ? 'Hide Cancelled' : 'Show Cancelled',
                        click: toggleShowCancelled,
                    },
                }}
                dayHeaderFormat={{ weekday: 'long', day: 'numeric' }}
                businessHours={businessHours}
                headerToolbar={headerToolbarConfig}
                eventClick={handleEventClick}
                datesSet={handleDateRangeChange}
                timeZone="Europe/London"
            />

            <RefreshTimetableProvider refresh={() => queryClient.refetchQueries(['timetable'])}>
                <LessonDetailsModal2
                    isOpen={isLessonDetailsModalOpen}
                    onClose={() => setIsLessonDetailsModalOpen(false)}
                    booking={selectedBooking}
                />
                <CoachEventDetailsModal
                    isOpen={isCoachEventDetailsModalOpen}
                    onClose={() => setIsCoachEventDetailsModalOpen(false)}
                    coachEvent={selectedCoachEvent}
                />
                <CoachAddModal
                    open={isAddEventModalOpen}
                    handleClose={() => setIsAddEventModalOpen(false)}
                />
                <WorkingHoursModal
                    isOpen={isWorkingHoursModalOpen}
                    onClose={() => setIsWorkingHoursModalOpen(false)}
                />
            </RefreshTimetableProvider>
        </>
    );
}
