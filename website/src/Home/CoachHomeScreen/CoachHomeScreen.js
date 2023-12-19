import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
/** @jsxImportSource @emotion/react */
import {css, Global} from "@emotion/react";

import axios from "axios";

import CoachAddEventModal from "./CoachAddEventModal/CoachAddEventModal";
import { TitleSection, ArrowButtonGroup, Button, checkRefreshRequired } from "../HomescreenHelpers";
import {fetchTimetable} from "../FetchTimetable";
import { LessonDetailsProvider } from "../Calendar/LessonDetailsContext";
import LessonDetailsModal from "../Calendar/LessonDetailsModal";
import CoachEventDetailsModal from "../Calendar/CoachEventDetailsModal";
import {CoachEventDetailsProvider} from "../Calendar/CoachEventDetailsContext";
import { RefreshTimetableProvider } from "./RefreshTimetableContext";
import WorkingHoursModal from "./WorkingHoursModal";
import { useShowCancelled, ShowCancelledProvider } from "./ShowCancelledContext";
import FullCalendar from '@fullcalendar/react'
import timeGridPlugin from '@fullcalendar/timegrid'
import { usePopup } from "../../Notifications/PopupContext";

export default function HomeScreen() {

    const { coachSlug } = useParams();
    const {showPopup} = usePopup();

    const [authorised, setAuthorised] = useState(false);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [view, setView] = useState('day');

    const [workingHours, setWorkingHours] = useState({});
    const [bookings, setBookings] = useState({});
    const [all, setAll] = useState({});
    const [coachEvents, setCoachEvents] = useState({});
    const [pricingRules, setPricingRules] = useState({});

    const [selected, setSelected] = useState([]);

    const [loadedDates, setLoadedDates] = useState([]);
    
    const [isStartingUp, setIsStartingUp] = useState(true);
    
    // Need a view, which is either day or week. Need start and end time which is 0-24 and represent start and end hours that are shown
    // Need the from and to date to be calculated. Default should show the current date and the week around it.

    const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false);
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

    const [defaultWorkingHours, setDefaultWorkingHours] = useState({});
    const [durations, setDurations] = useState([]);

    const [timetableEvents, setTimetableEvents] = useState({});

    const [min, setMin] = useState(null);
    const [max, setMax] = useState(null);

    const [isLessonDetailsShown, setIsLessonDetailsShown] = useState(false);
    const [lessonDetailsBooking, setLessonDetailsBooking] = useState(null);

    const [isCoachEventShown, setIsCoachEventShown] = useState(false);
    const [coachEvent, setCoachEvent] = useState(null);

    const [showCancelled, setShowCancelled] = useState(false);

    const [setUp, setSetUp] = useState(false);
    const [link, setLink] = useState(null);

    const redo = (forceCancelled=showCancelled) => {

        setLoadedDates([]);
        fetchTimetableData(fromDate, toDate, forceCancelled);

    }

    const refresh = async (fromDate, toDate) => {
        const refreshRequired = checkRefreshRequired(loadedDates, fromDate, toDate);
        if (refreshRequired){
            await fetchTimetableData(fromDate, toDate);
        }
    }

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

    const fetchTimetableData = async (fromDate, toDate, forceCancelled) => {

        const data = await fetchTimetable(fromDate, toDate, coachSlug, true, forceCancelled);

        if (data.exists) {

            const authorised = data.authorised;

            setAuthorised(authorised);

            if (authorised) {

                setWorkingHours(prevWorkingHours => ({
                    ...prevWorkingHours,
                    ...data.workingHours
                }));
                setDefaultWorkingHours(data.defaultWorkingHours);
                
                
                const newAll = {
                    ...all,
                    ...data.all
                };
        
                setAll(newAll);

                setMin(data.global_min);
                setMax(data.global_max);
                setDurations(data.durations);
                setPricingRules(data.pricingRules)

                setBookings(prevBookings => ({
                    ...prevBookings,
                    ...data.bookings
                }));
                setCoachEvents(prevCoachEvents => ({
                    ...prevCoachEvents,
                    ...data.coachEvents
                }));
                const newDates = Object.keys(data.workingHours);
                setLoadedDates(prevDates => [...prevDates, ...newDates]);

            }

            // return newAll;

        } else {
        }

        setIsStartingUp(false);

    }
    const handleCopy = async () => {
        await navigator.clipboard.writeText(link);
        showPopup("Link copied to clipboard");
      };

    useEffect(() => {
        console.log(timetableEvents);
    }, [timetableEvents]);

    useEffect(() => {


        const checkSetUp = async () => {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
                        
            setSetUp(response.data.any)

        }
        
        setIsStartingUp(true);
        fetchTimetableData(startDate, startDate);
        checkSetUp();

    }, []);



    // Define the styles separately for better readability
    const containerStyle = {
        height: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: 25,
    };

    // Helper components or functions to keep the JSX clean
    const GlobalStyles = () => (
        <Global
            styles={css`
                body {
                    overflow: hidden;
                }
            `}
        />
    );

    const handleSetShowCancelled = () => {
        const newValue = !showCancelled;
        setShowCancelled(newValue);
        redo(newValue);
    }

    // Main component
    return (
        <div style={containerStyle}>
            {!isStartingUp ? (
                <>
                    <GlobalStyles />
                    {authorised ? (
                        <>
                            <RefreshTimetableProvider refresh={redo}>
                                <TitleSection>
                                    
                                <WorkingHoursModal isOpen={isWorkingHoursModalOpen} onClose={() => setIsWorkingHoursModalOpen(false)}/>
                            
                                </TitleSection>
                                <CoachEventDetailsProvider setCoachEvent={setCoachEvent} setShown={setIsCoachEventShown}>
                                    <LessonDetailsProvider setBookings={setLessonDetailsBooking} setShown={setIsLessonDetailsShown}>
                                        {setUp ? (
                                            <ShowCancelledProvider showCancelled={showCancelled} setShowCancelled={setShowCancelled}>
                                                <FullCalendar
                                                    height={'100%'}
                                                    plugins={[timeGridPlugin]}
                                                    initialView='timeGridWeek'
                                                    events={[
                                                        { title: 'event 1', date: '2023-12-12' },
                                                    ]}
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
                                                            text: 'Link',
                                                            click: () => handleCopy(),
                                                        },
                                                    }}
                                                    headerToolbar={{
                                                        left: 'prev,next today',
                                                        center: 'title',
                                                        right: 'timeGridWeek,timeGridDay addEvent workingHours customLink',
                                                    }}
                                                />

                                            </ShowCancelledProvider>
                                        ): (
                                        <>                                        
                                            <h2>
                                                This section will allow you to manage, schedule and arrange lessons.
                                            </h2>
                                            <h3>
                                                You must first set some working hours, durations and pricing rules before you can access the timetable.                                            
                                            </h3>
                                            <button onClick={() => {
                                                window.location.href = `${process.env.REACT_APP_WEBSITE_URL}/#/dashboard/settings`
                                            }}>
                                                Settings
                                            </button>

                                        </>)
                                    }
                                    </LessonDetailsProvider>
                                </CoachEventDetailsProvider>
                                <CoachEventDetailsModal isOpen={isCoachEventShown} onClose={() => setIsCoachEventShown(false)} coachEvent={coachEvent}/>
                                <LessonDetailsModal isOpen={isLessonDetailsShown} onClose={() => setIsLessonDetailsShown(false)} booking={lessonDetailsBooking}/>
                                <CoachAddEventModal
                                    isOpen={isAddEventModalOpen}
                                    onClose={() => setIsAddEventModalOpen(false)}       
                                    settings={{
                                        durations: durations
                                    }}           
                                    loadedDates={loadedDates}
                                    all={timetableEvents}
                                    durations={durations}   
                                    fetchTimetableData={fetchTimetableData}
                                />
                            </RefreshTimetableProvider>
                        </>
                    ) : (
                        <div>
                            <h1>Unauthorised, please use the sign in button to log in again. Or if you are a player visit the url provided by your coach</h1>
                        </div>
                    )}
                </>
            ) : (
                <></>
            )}
        </div>
    );

}
