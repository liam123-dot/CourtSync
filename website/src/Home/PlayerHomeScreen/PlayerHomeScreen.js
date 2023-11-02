import React, {useEffect, useState} from "react";
import { useParams, useNavigate } from "react-router-dom";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import {css, Global} from "@emotion/react";
import axios from "axios";

import Timetable from "../Calendar/Timetable";
import BookLessonModal from "./BookLessonModal";
import GetDaysBetweenDates from "../GetDaysBetweenDates";
import ProfileButton from "../../SidePanel/ProfilePicture";
import { TitleSection, ArrowButtonGroup, Button, DateLabel, checkRefreshRequired, handleSetView, getStartEndOfWeek, handleNext, handlePrevious } from "../HomescreenHelpers";
import {fetchTimetable} from "../FetchTimetable";

const CoachNotSetUp = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.5em;
    color: red;
`;

export default function PlayerHomeScreen() {

    const { coachSlug } = useParams();


    const [authorised, setAuthorised] = useState(false);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [view, setView] = useState("week");

    const [isBookLessonModalOpen, setIsBookLessonModalOpen] = useState(false);

    const [loadedDates, setLoadedDates] = useState([]);

    const [workingHours, setWorkingHours] = useState(null);
    const [durations, setDurations] = useState(null);
    const [pricingRules, setPricingRules] = useState(null);
    const [bookings, setBookings] = useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    const [formattedDateRange, setFormattedDateRange] = useState("");

    const [coachExists, setCoachExists] = useState(false);

    const navigate = useNavigate();

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

            setWorkingHours(prevWorkingHours => ({
                ...prevWorkingHours,
                ...data.workingHours
            }));
            setAuthorised(data.authorised);
            setBookings(prevBookings => ({
                ...prevBookings,
                ...data.bookings
            }))
            setPricingRules(data.pricingRules);
            setDurations(data.durations);

            const newDates = Object.keys(data.pricingRules);
            setLoadedDates(prevDates => [...prevDates, ...newDates]);
            setAuthorised(data.authorised);
            setCoachExists(true);
        } else {
            setCoachExists(false);
        }

    }

    useEffect(() => {

        const calculateStartingDates = () => {

            const currentDate = new Date();
            
            const startAndEnd = getStartEndOfWeek(currentDate);

            setFromDate(startAndEnd.fromDate);
            setToDate(startAndEnd.toDate);

            return startAndEnd;

        }

        const fetchCoachProfile = async () => {

            try {
                const response = await axios.get(`${process.env.REACT_APP_URL}/auth/coach/${coachSlug}/profile-picture`)

                const url = response.data.url

                setProfilePictureUrl(url);

            } catch (error){
                console.log(error);
            }

        }
        

        fetchCoachProfile();
        const dates = calculateStartingDates();
        fetchTimetableData(dates.fromDate, dates.toDate);

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

    const checkDataLoaded = () => {
        return durations && workingHours && pricingRules;
    }

    const checkDataInitialised = () => {
        
        return durations.length > 0 && 
        Object.keys(workingHours).length > 0 && 
        Object.keys(pricingRules).length > 0;
    }

    return (
        <>
            {!coachExists ? (
                <CoachNotSetUp>
                    No coach account exists with the provided url
                </CoachNotSetUp>
            ) : (
                !checkDataInitialised() ? (
                    <CoachNotSetUp>
                    The coach has not set up their account. Lessons cannot be booked at this time.
                    </CoachNotSetUp>
                ): (

                    <div style={{ 
                        height: '100vh', 
                        width: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        paddingBottom: 25
                    }}>
                        <Global
                            styles={css`
                            body {
                                overflow: hidden;
                            }
                        `}
                        />

                        <TitleSection>
                            <ArrowButtonGroup>
                                <Button onClick={() => setIsBookLessonModalOpen(true)}>Book Lesson</Button>
                            </ArrowButtonGroup>

                            <BookLessonModal 
                                isOpen={isBookLessonModalOpen}
                                onClose={() => setIsBookLessonModalOpen(false)}
                                days={GetDaysBetweenDates(fromDate.toISOString().split('T')[0], toDate.toISOString().split('T')[0])}
                                fromDate={fromDate}
                                bookings={bookings}
                                durations={durations}
                                pricingRules={pricingRules}
                                workingHours={workingHours}
                                coachSlug={coachSlug}
                                loadedDates={loadedDates}
                                fetchData={fetchTimetableData}
                                redo={redo}
                            />

                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <ArrowButtonGroup>
                                    <Button onClick={() => handlePrevious(fromDate, toDate, setFromDate, setToDate, refresh, view)}>←</Button>
                                    <Button onClick={() => handlePrevious(fromDate, toDate, setFromDate, setToDate, refresh, view)}>→</Button>
                                </ArrowButtonGroup>
                                <DateLabel>{formattedDateRange}</DateLabel>
                            </div>
                            <div>
                                <Button selected={view === "day"} onClick={() => handleSetView("day", setView, fromDate, toDate, setFromDate, setToDate, refresh)}>Day</Button>
                                <Button selected={view === "week"} onClick={() => handleSetView("week", setView, fromDate, toDate, setFromDate, setToDate, refresh)}>Week</Button>
                            </div>
                            <ProfileButton imageUrl={profilePictureUrl}/>                        
                        </TitleSection>
                        <Timetable  
                            fromDate={fromDate} 
                            toDate={toDate} 
                            view={view} 
                            workingHours={workingHours}
                            bookings={bookings}
                            authorised={false}
                        />

                    </div>
                )
            )}
            
        </>
    );
}
