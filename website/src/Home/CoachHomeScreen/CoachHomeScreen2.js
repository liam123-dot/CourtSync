import React, {useEffect, useState, useRef} from 'react'
import axios from 'axios'

import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import LessonDetailsModal2 from './LessonDetailsModal2'
import CoachEventDetailsModal from '../Calendar/CoachEventDetailsModal';
import CoachAddEventModal from './CoachAddEventModal/CoachAddEventModal';
import WorkingHoursModal from './WorkingHoursModal';
import { Backdrop, CircularProgress } from '@mui/material';

import { usePopup } from '../../Notifications/PopupContext';
import { RefreshTimetableProvider } from './RefreshTimetableContext';

export default function CoachHomeScreen2() {

    const [bookings, setBookings] = useState([])
    const [link, setLink] = useState(null);

    const [isLessonDetailsModalOpen, setIsLessonDetailsModalOpen] = useState(false)
    const [selectedBooking, setSelectedBooking] = useState(null)

    const [isCoachEventDetailsModalOpen, setIsCoachEventDetailsModalOpen] = useState(false)
    const [selectedCoachEvent, setSelectedCoachEvent] = useState(null)

    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false)
    const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false)

    const [eventsLoading, setEventsLoading] = useState(false);

    const [businessHours, setBusinessHours] = useState([]);

    const { showPopup } = usePopup();
    const bookingsCache = useRef({}); // Cache for storing bookings data

    const [dateRange, setDateRange] = useState({ start: null, end: null });

    const [showCancelled, setShowCancelled] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(link);
        showPopup("Link copied to clipboard");
    };

    const fetchData = async (fromTime, toTime, force=false) => {
        const cacheKey = `${fromTime}-${toTime}`;
        if (!force && bookingsCache.current[cacheKey]) {
            // Use cached data if available
            setBookings(bookingsCache.current[cacheKey]);
            setEventsLoading(false);
            return;
        }

        setEventsLoading(true);

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable?fromTime=${fromTime}&toTime=${toTime}&showCancelled=${showCancelled}`,
            {
                headers: {
                    Authorization: localStorage.getItem('AccessToken'),
                }
            })
            const data = response.data;

            const events = data.events;
            const businessHours = data.businessHours;
            
            setBusinessHours(businessHours);

            bookingsCache.current[cacheKey] = events; // Update cache
            setBookings(events);
        } catch (error) {
            console.log(error)
        }

        setEventsLoading(false);

    }

    const handleEventClick = (clickInfo) => {
        const data = clickInfo.event.extendedProps;
        const type = data.type;
        if (type === 'booking') {
            setSelectedBooking(data);
            setIsLessonDetailsModalOpen(true);
        } else {
            setSelectedCoachEvent(data);
            setIsCoachEventDetailsModalOpen(true);
        }
    }

    useEffect (() => {

        if (dateRange.start === null || dateRange.end === null) return;

        fetchData(dateRange.start, dateRange.end)

    }, [dateRange, showCancelled])

    useEffect(() => {
        const getLink = async () => {
          const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/user/me/coach_url`,
            {
              headers: {
                Authorization: localStorage.getItem("AccessToken"),
              },
            }
          );
          setLink(response.data.coach_url);
        };
    
        getLink();
      }, []);

    const toggleShowCancelled = () => {
        setShowCancelled(!showCancelled);
    };

    const handleDateRangeChange = (info) => {
        // Convert info.start and info.end to timestamps
        const startTimestamp = new Date(info.start).getTime() / 1000;
        const endTimestamp = new Date(info.end).getTime() / 1000;
        setDateRange({ start: startTimestamp, end: endTimestamp });
    };

    const refresh = (force = false) => {

        fetchData(dateRange.start, dateRange.end, force)

    }

    return (

        <>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={eventsLoading}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <FullCalendar
                height={'100%'}
                plugins={[timeGridPlugin]}
                initialView='timeGridWeek'
                firstDay={1}
                events={bookings}
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
                        click: () => handleCopy(),
                    },
                    toggleCancelled: {
                        text: showCancelled ? 'Hide Cancelled' : 'Show Cancelled',
                        click: toggleShowCancelled,
                    },
                }}
                dayHeaderFormat={{ weekday: 'long', day: 'numeric' }}
                businessHours={businessHours}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'timeGridWeek,timeGridDay addEvent workingHours customLink toggleCancelled',
                }}
                eventClick={handleEventClick}
                datesSet={handleDateRangeChange}
            />

            <RefreshTimetableProvider refresh={refresh}>
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
                <CoachAddEventModal
                    isOpen={isAddEventModalOpen}
                    onClose={() => setIsAddEventModalOpen(false)}
                />
                <WorkingHoursModal      
                    isOpen={isWorkingHoursModalOpen}
                    onClose={() => setIsWorkingHoursModalOpen(false)}
                />
            </RefreshTimetableProvider>
        </>


    )

}