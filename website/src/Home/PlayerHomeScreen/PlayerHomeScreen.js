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

const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 2px solid #4A90E2;
`;

const ArrowButtonGroup = styled.div`
  display: flex;
`;

const Button = styled.button`
  margin: 0 5px;
  padding: 10px 15px;
  font-size: 1.2em;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
  border-bottom: ${props => props.selected ? '3px solid #4A90E2' : 'none'};

  &:hover {
    color: #357ABD;
  }
`;

const DateLabel = styled.span`
  margin: 0 10px;
  font-weight: bold;
  font-size: 1.2em;
`;

const CoachNotSetUp = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    font-size: 1.5em;
    color: red;
`;

export default function PlayerHomeScreen() {

    const [authorised, setAuthorised] = useState(false);
    const { coachSlug } = useParams();

    const [view, setView] = useState("week");

    const [isBookLessonModalOpen, setIsBookLessonModalOpen] = useState(false);

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [loadedDates, setLoadedDates] = useState([]);

    const [workingHours, setWorkingHours] = useState(null);
    const [durations, setDurations] = useState(null);
    const [pricingRules, setPricingRules] = useState(null);
    const [bookings, setBookings] = useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    const [formattedDateRange, setFormattedDateRange] = useState("");

    const navigate = useNavigate();

    const checkRefreshRequired = (fromDate, toDate) => {
        let currentDate = new Date(fromDate);

        while (currentDate <= toDate) {
            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
            
            if (!loadedDates.includes(formattedDate)) {
                return true; // Refresh required
            }

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return false; // No refresh required
    }

    const redo = () => {

        setLoadedDates([]);
        fetchTimetableData(fromDate, toDate);

    }

    const refresh = async (fromDate, toDate) => {
        const refreshRequired = checkRefreshRequired(fromDate, toDate);
        if (refreshRequired){
            await fetchTimetableData(fromDate, toDate);
        }
    }

    const fetchTimetableData = async (fromDate, toDate) => {

        // Create new Date objects based on the passed dates to avoid direct mutation
        const fromDateCopy = new Date(fromDate);
        const toDateCopy = new Date(toDate);
    
        fromDateCopy.setHours(0, 0, 0);
        toDateCopy.setHours(23, 59, 59);
    
        const epochFromDate = Math.floor(fromDateCopy.getTime() / 1000);
        const epochToDate = Math.floor(toDateCopy.getTime() / 1000);
    
        const headers = {
            'Authorization': localStorage.getItem('AccessToken')
        }
            
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_URL}/timetable/${coachSlug}?from_time=${epochFromDate}&to_time=${epochToDate}`,
                {headers: headers}
            );
    
            console.log(response);
    
            const data = response.data;
    
            setWorkingHours(prevWorkingHours => ({
                ...prevWorkingHours,
                ...data.working_hours
            }));
            setAuthorised(data.authorised);
            setBookings(prevBookings => ({
                ...prevBookings,
                ...data.bookings
            }))
            setPricingRules(data.pricing_rules);
            setDurations(data.durations);

            const newDates = Object.keys(data.working_hours);
            setLoadedDates(prevDates => [...prevDates, ...newDates]);

            return {
                workingHours: data.working_hours,
                bookings: data.bookings,
                pricingRules: data.pricing_rules,
                durations: data.durations
            }
    
        } catch (error) {
    
            console.log(error);
            const errorResponse = error.response;
            console.log(errorResponse);
            const statusCode = errorResponse && errorResponse.statusCode;
            if (statusCode === 404) {
                console.log('not found');
            }
    
        }
    }

    const handleSetView = view => {
        const currentDate = new Date();
    
        if (view === 'week') {
            const startAndEnd = getStartEndOfWeek(fromDate);
            setFromDate(startAndEnd.fromDate);
            setToDate(startAndEnd.toDate);
        } else {
            if (currentDate >= fromDate && currentDate <= toDate) {
                setFromDate(currentDate);
                setToDate(currentDate);
            } else {
                setToDate(fromDate);
            }
        }
        setView(view);
    }
    

    const getStartEndOfWeek = currentDate => {
        const currentDayOfWeek = currentDate.getDay();  // 0 (Sunday) - 6 (Saturday)

        const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
        const sundayOffset = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;

        const monday = new Date(currentDate);
        monday.setDate(monday.getDate() + mondayOffset);

        const sunday = new Date(currentDate);
        sunday.setDate(sunday.getDate() + sundayOffset);

        return {fromDate: monday, toDate: sunday};

    }

    const handleNext = async () => {
        const newFromDate = new Date(fromDate);
        const newToDate = new Date(toDate);
        if (view === 'week') {
            newFromDate.setDate(fromDate.getDate() + 7);
    
            newToDate.setDate(toDate.getDate() + 7);

            await refresh(newFromDate, newToDate);

        } else if (view === 'day') {
            newFromDate.setDate(fromDate.getDate() + 1);
    
            newToDate.setDate(toDate.getDate() + 1);
            
            await refresh(newFromDate, newToDate);

        }
            
        setFromDate(newFromDate);
        setToDate(newToDate);
    }
    
    const handlePrevious = async () => {
        const newFromDate = new Date(fromDate);
        const newToDate = new Date(toDate);
        if (view === 'week') {
            newFromDate.setDate(fromDate.getDate() - 7);
    
            newToDate.setDate(toDate.getDate() - 7);
    
            await refresh(newFromDate, newToDate);
        } else {
            newFromDate.setDate(fromDate.getDate() - 1);
    
            newToDate.setDate(toDate.getDate() - 1);
    
            await refresh(newFromDate, newToDate);
        }
        setFromDate(newFromDate);
        setToDate(newToDate);
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
            {!checkDataLoaded() ? (
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
                                    <Button onClick={handlePrevious}>←</Button>
                                    <Button onClick={handleNext}>→</Button>
                                </ArrowButtonGroup>
                                <DateLabel>{formattedDateRange}</DateLabel>
                            </div>
                            <div>
                                <Button selected={view === "day"} onClick={() => handleSetView("day")}>Day</Button>
                                <Button selected={view === "week"} onClick={() => handleSetView("week")}>Week</Button>
                            </div>
                            <Button onClick={() => {navigate('/coach/signin')}}>
                                Login
                            </Button>
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
