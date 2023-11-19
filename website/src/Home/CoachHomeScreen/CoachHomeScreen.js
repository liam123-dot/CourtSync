import React, {useEffect, useState, useCallback} from "react";
import { useParams } from "react-router-dom";
/** @jsxImportSource @emotion/react */
import {css, Global} from "@emotion/react";
import { FaRegClock } from 'react-icons/fa';
import axios from "axios";

import Timetable from "../Calendar/Timetable";
import WorkingHoursModal from '../Calendar/WorkingHoursModal'
import CoachAddEventModal from "./CoachAddEventModal";
import SidePanel from "../../SidePanel/SidePanel"
import { refreshTokens } from "../../Authentication/RefreshTokens";
import Searchbar from "./Searchbar";
import { TitleSection, ArrowButtonGroup, Button, DateLabel, checkRefreshRequired, handleSetView, handleNext, handlePrevious } from "../HomescreenHelpers";
import {fetchTimetable} from "../FetchTimetable";
import { BookingCancellationProvider } from "./BookingContextProvider";
import { BookingObject } from "../Calendar/BookingObject";
import { WorkingHoursObject } from "../Calendar/WorkingHoursObject";

export default function HomeScreen() {

    const { coachSlug } = useParams();

    const [authorised, setAuthorised] = useState(false);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [view, setView] = useState('day');

    const [workingHours, setWorkingHours] = useState({});
    const [bookings, setBookings] = useState({});
    const [all, setAll] = useState({});

    const [selected, setSelected] = useState([]);

    const [loadedDates, setLoadedDates] = useState([]);
    
    const [isStartingUp, setIsStartingUp] = useState(true);
    
    // Need a view, which is either day or week. Need start and end time which is 0-24 and represent start and end hours that are shown
    // Need the from and to date to be calculated. Default should show the current date and the week around it.

    const [isWorkingHoursModalOpen, setIsWorkingHoursModalOpen] = useState(false);
    const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);

    const [defaultWorkingHours, setDefaultWorkingHours] = useState({});
    const [durations, setDurations] = useState([]);

    const [profilePictureUrl, setProfilePictureUrl] = useState(null);
    const [formattedDateRange, setFormattedDateRange] = useState("");

    const [timetableEvents, setTimetableEvents] = useState({});

    const [min, setMin] = useState(null);
    const [max, setMax] = useState(null);

    const redo = () => {

        setLoadedDates([]);
        fetchTimetableData(fromDate, toDate);

    }


    const refresh = async (fromDate, toDate) => {
        const refreshRequired = checkRefreshRequired(loadedDates, fromDate, toDate);
        if (refreshRequired){
            await fetchTimetableData(fromDate, toDate);
        }
    }

    const fetchTimetableData = async (fromDate, toDate) => {

        const data = await fetchTimetable(fromDate, toDate, coachSlug);

        if (data.exists) {

            // console.log(data);

            setWorkingHours(prevWorkingHours => ({
                ...prevWorkingHours,
                ...data.workingHours
            }));
            setAuthorised(data.authorised);
            setDefaultWorkingHours(data.defaultWorkingHours);
            
            
            const newAll = {
                ...all,
                ...data.all
            };
    
            setAll(newAll);

            setMin(data.global_min);
            setMax(data.global_max);
            setDurations(data.durations);

            setBookings(prevBookings => ({
                ...prevBookings,
                ...data.bookings
            }))
            const newDates = Object.keys(data.workingHours);
            setLoadedDates(prevDates => [...prevDates, ...newDates]);

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
                            booking.width
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
                        console.log(item)
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

        setTimetableEvents(convertBookingsToTimetableEvents(getWorkingHoursFromAll(timetableEvents)));

    }, [bookings, all]);

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

        const fetchCoachProfile = async () => {

            if (localStorage.getItem('RefreshLoading') === 'true'){
                await refreshTokens();
            }

            try {
                const response = await axios.get(`${process.env.REACT_APP_URL}/auth/coach/${coachSlug}/profile-picture`)

                const url = response.data.url

                setProfilePictureUrl(url);

            } catch (error){
                console.log(error);
            }

        }
        
        setIsStartingUp(true);
        fetchCoachProfile();
        const startDate = calculateStartingDates();
        fetchTimetableData(startDate, startDate);

    }, []);

    const updateFormattedDateRange = () => {
        if (!fromDate || !toDate) return;

        const formatSingleDate = (date) => {
            return `${date.getDate()} ${date.toLocaleString('default', { month: 'long' })}`;
        }

        let formattedRange;
        if (fromDate.toDateString() === toDate.toDateString()) {
            formattedRange = formatSingleDate(fromDate);
        } else if (fromDate.getMonth() === toDate.getMonth()) {
            formattedRange = `${fromDate.getDate()} - ${formatSingleDate(toDate)}`;
        } else {
            formattedRange = `${formatSingleDate(fromDate)} - ${formatSingleDate(toDate)}`;
        }

        setFormattedDateRange(formattedRange);
    }

    useEffect(() => {
        updateFormattedDateRange();
    }, [fromDate, toDate]);

    
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

    // Main component
    return (
        <div style={containerStyle}>
            {!isStartingUp ? (
                <>
                    <GlobalStyles />
                    {authorised ? (
                        <>
                            <TitleSection>
                                <ArrowButtonGroup>
                                    <Button onClick={() => setIsWorkingHoursModalOpen(true)}><FaRegClock/></Button>
                                    <Button onClick={() => setIsAddEventModalOpen(true)}>+</Button>
                                </ArrowButtonGroup>
                                
                                {/* Modals and other components */}
                                <WorkingHoursModal 
                                    isOpen={isWorkingHoursModalOpen} 
                                    onClose={() => setIsWorkingHoursModalOpen(false)} 
                                    workingHours={defaultWorkingHours} 
                                    setWorkingHours={setDefaultWorkingHours}
                                    redo={redo}
                                    bookings={bookings}
                                />
                                <CoachAddEventModal
                                    isOpen={isAddEventModalOpen}
                                    onClose={() => setIsWorkingHoursModalOpen(false)}       
                                    settings={{
                                        durations: durations
                                    }}           
                                    loadedDates={loadedDates}
                                    all={timetableEvents}
                                    durations={durations}   
                                    fetchTimetableData={fetchTimetableData}
                                />
                                
                                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                                    <DateLabel>{formattedDateRange}</DateLabel>
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

                                {/* Search and SidePanel components */}
                                <div>
                                    <Searchbar 
                                        bookings={bookings}
                                        setBookings={setBookings}
                                        selected={selected}
                                        setSelected={setSelected}
                                    />
                                </div>
                                <SidePanel
                                imageUrl={profilePictureUrl}
                                />
                            </TitleSection>
                            <BookingCancellationProvider setBookings={setBookings}>
                                <Timetable
                                    fromDate={fromDate}
                                    toDate={toDate}
                                    view={view}
                                    timetableObjects={timetableEvents}
                                    coachView={true}
                                    min={min}
                                    max={max}
                                />
                            </BookingCancellationProvider>
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
