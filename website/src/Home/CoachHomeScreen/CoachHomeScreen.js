import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
/** @jsxImportSource @emotion/react */
import {css, Global} from "@emotion/react";

import axios from "axios";

import Timetable from "../Calendar/Timetable";
import CoachAddEventModal from "./CoachAddEventModal/CoachAddEventModal";
import { TitleSection, ArrowButtonGroup, Button, checkRefreshRequired, handleSetView, handleNext, handlePrevious } from "../HomescreenHelpers";
import {fetchTimetable} from "../FetchTimetable";
import { BookingObject } from "../Calendar/BookingObject";
import { CoachEventObject } from "../Calendar/CoachEventObject";
import { WorkingHoursObject } from "../Calendar/WorkingHoursObject";
import { LessonDetailsProvider } from "../Calendar/LessonDetailsContext";
import LessonDetailsModal from "../Calendar/LessonDetailsModal";
import DateSelector from "./DateSelector";
import CoachEventDetailsModal from "../Calendar/CoachEventDetailsModal";
import {CoachEventDetailsProvider} from "../Calendar/CoachEventDetailsContext";
import { RefreshTimetableProvider } from "./RefreshTimetableContext";
import WorkingHoursModal from "./WorkingHoursModal";
import LinkButton from "./LinkButton";
import { useShowCancelled, ShowCancelledProvider } from "./ShowCancelledContext";

export default function HomeScreen() {

    const { coachSlug } = useParams();

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

    useEffect(() => {

        const convertBookingsToTimetableEvents = (events) => {
            const newTimetableEvents = { ...events };

            Object.keys(bookings).forEach((key) => {
                if (Array.isArray(bookings[key])) {
                    const eventArray = bookings[key].map((booking) => {
                        return new BookingObject(
                            booking.booking_id,
                            booking.start_time,
                            booking.duration,
                            key,
                            booking.contact_name,
                            booking.contact_email,
                            booking.contact_phone_number,
                            booking.cost,
                            booking.paid,
                            booking.player_name,
                            booking.status,
                            booking.position,
                            booking.width,
                            booking.repeat_id,
                            booking.repeat_frequency,
                            booking.repeat_until
                        );
                    });

                    if (newTimetableEvents[key]) {
                        newTimetableEvents[key] = [...newTimetableEvents[key], ...eventArray];
                    } else {
                        newTimetableEvents[key] = eventArray;
                    }
                }
            });
            return newTimetableEvents;
        };

        const getWorkingHoursFromAll = (events) => {
            const newTimetableEvents = { ...events };
            console.log(newTimetableEvents)
            Object.keys(all).forEach((key) => {
                const eventArray = all[key].map((item) => {                    
                    if (item.type === "working_hour") {
                        // console.log(item)
                        return new WorkingHoursObject(
                            0,
                            item.start_time,
                            item.duration,
                            key,
                            item.start_time_without_global,
                            item.duration_without_global                                
                        );                        
                    }
                    return null; // Add this line to handle cases where item.type is not "working_hours"
                }).filter(item => item !== null); // Add this line to remove null items from eventArray
    
                if (newTimetableEvents[key]) {
                    newTimetableEvents[key] = [...newTimetableEvents[key], ...eventArray];
                } else {
                    newTimetableEvents[key] = eventArray;
                }
            });
            return newTimetableEvents; // Change this line to return newTimetableEvents instead of workingHours
        }

        const convertCoachEventsToTimetableEvents = (events) => {
            const newTimetableEvents = { ...events };
            Object.keys(coachEvents).forEach((key) => {
                const eventArray = coachEvents[key].map((item) => {
                    console.log(item);
                    return new CoachEventObject(
                        item.event_id,
                        item.start_time,
                        item.duration,
                        key,
                        item.title,
                        item.description,
                        item.position,
                        item.width,
                        item.status,
                        item.repeat_id,
                        item.repeat_frequency,
                        item.repeat_until
                    );                
                })
                if (newTimetableEvents[key]) {
                    newTimetableEvents[key] = [...newTimetableEvents[key], ...eventArray];
                } else {
                    newTimetableEvents[key] = eventArray;
                }                
            })
            return newTimetableEvents;
        }

        setTimetableEvents(convertCoachEventsToTimetableEvents(convertBookingsToTimetableEvents(getWorkingHoursFromAll({}))));

    }, [bookings, all, coachEvents]);

    useEffect(() => {
        console.log(timetableEvents);
    }, [timetableEvents]);

    useEffect(() => {

        const calculateStartingDates = () => {

            const currentDate = new Date();                

            setFromDate(currentDate);
            setToDate(currentDate);

            return currentDate;

        }

        const checkSetUp = async () => {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
                        
            setSetUp(response.data.any)

        }
        
        setIsStartingUp(true);
        const startDate = calculateStartingDates();
        fetchTimetableData(startDate, startDate);
        checkSetUp();

    }, []);

    
      useEffect(() => {

        const filtersApplied = selected && selected.length > 0;
        if (bookings) {
            setBookings((currentBookings) => {
                // Create a new object to hold the updated bookings
                const updatedBookings = {};
            
                // Iterate over each key in the currentBookings object
                Object.keys(currentBookings).forEach((key) => {
                // Check if the current key has a list of bookings
                if (Array.isArray(currentBookings[key])) {
                    // If so, map over that list to update the 'filtered' property
                    updatedBookings[key] = currentBookings[key].map((booking) => {
                    
                        return { ...booking, filtersApplied: filtersApplied };                                                   
                    
                    });
                }
                });
            
                // Return the updated bookings object
                return updatedBookings;
            });
        }

      }, [selected])


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

    const ArrowNavigation = ({ handlePrevious, handleNext, fromDate, toDate, setFromDate, setToDate, refresh, view }) => (
        <ArrowButtonGroup>
            <Button onClick={() => handlePrevious(fromDate, toDate, setFromDate, setToDate, refresh, view)}>←</Button>
            <Button onClick={() => handleNext(fromDate, toDate, setFromDate, setToDate, refresh, view)}>→</Button>
        </ArrowButtonGroup>
    );

    const ViewButtons = ({ view, setView, handleSetView, fromDate, toDate, setFromDate, setToDate, refresh }) => (
        <div>
            <Button selected={view === "day"} onClick={() => handleSetView("day", setView, fromDate, toDate, setFromDate, setToDate, refresh)}>Day</Button>
            <Button selected={view === "week"} onClick={() => handleSetView("week", setView, fromDate, toDate, setFromDate, setToDate, refresh)}>Week</Button>
        </div>
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
                                    <ArrowButtonGroup>
                                        <Button onClick={() => setIsAddEventModalOpen(true)}>+</Button>
                                        <Button onClick={() => setIsWorkingHoursModalOpen(true)}>⚙</Button>
                                        <LinkButton/>
                                        <label>
                                            Show Cancelled:
                                            <input
                                                type="checkbox"
                                                checked={showCancelled}
                                                onChange={handleSetShowCancelled}
                                            />
                                        </label>
                                    </ArrowButtonGroup>
                                    
                                    <WorkingHoursModal isOpen={isWorkingHoursModalOpen} onClose={() => setIsWorkingHoursModalOpen(false)}/>


                                    
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <ArrowNavigation
                                            handlePrevious={handlePrevious}
                                            handleNext={handleNext}
                                            fromDate={fromDate}
                                            toDate={toDate}
                                            setFromDate={setFromDate}
                                            setToDate={setToDate}
                                            refresh={refresh}
                                            view={view}
                                        />
                                        <DateSelector
                                            fromDate={fromDate}
                                            toDate={toDate}
                                            setFromDate={setFromDate}
                                            setToDate={setToDate}
                                        />
                                    </div>

                                    <ViewButtons
                                        view={view}
                                        setView={setView}
                                        handleSetView={handleSetView}
                                        fromDate={fromDate}
                                        toDate={toDate}
                                        setFromDate={setFromDate}
                                        setToDate={setToDate}
                                        refresh={refresh}
                                    />

                                    {/* Search and SidePanel components
                                    <div>
                                        <Searchbar 
                                            timetableEvents={timetableEvents}
                                            setTimetableEvents={setTimetableEvents}
                                            selected={selected}
                                            setSelected={setSelected}
                                        />
                                    </div> */}
                                </TitleSection>
                                <CoachEventDetailsProvider setCoachEvent={setCoachEvent} setShown={setIsCoachEventShown}>
                                    <LessonDetailsProvider setBookings={setLessonDetailsBooking} setShown={setIsLessonDetailsShown}>
                                        {setUp ? (
                                            <ShowCancelledProvider showCancelled={showCancelled} setShowCancelled={setShowCancelled}>
                                                <Timetable
                                                    fromDate={fromDate}
                                                    toDate={toDate}
                                                    view={view}
                                                    timetableObjects={timetableEvents}
                                                    coachView={true}
                                                    min={min}
                                                    max={max}
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
