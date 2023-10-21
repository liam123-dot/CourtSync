import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import {css, Global} from "@emotion/react";
import { FaRegClock } from 'react-icons/fa';
import axios from "axios";

import Timetable from "../Calendar/Timetable";
import BookLessonModal from "./BookLessonModal";
import GetDaysBetweenDates from "../GetDaysBetweenDates";

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

export default function PlayerHomeScreen() {

    const [authorised, setAuthorised] = useState(false);

    const [workingHours, setWorkingHours] = useState({
        "0": { start_time: null, end_time: null },
        "1": { start_time: null, end_time: null },
        "2": { start_time: null, end_time: null },
        "3": { start_time: null, end_time: null },
        "4": { start_time: null, end_time: null },
        "5": { start_time: null, end_time: null },
        "6": { start_time: null, end_time: null }
    });
    const [lessonTypes, setLessonTypes] = useState(null);
    const [bookings, setBookings] = useState(null)

    useEffect(() => {

        const fetchTimetableData = async () => {

            try {

                const url = window.location.href;
                const splitUrl = url.split('/');
                const slug = splitUrl.slice(-1);

                handleSetView('week')

                fromDate.setHours(startTime, 0, 0);
                toDate.setHours(endTime, 0, 0);

                const epochFromDate = Math.floor(fromDate.getTime() / 1000);
                const epochToDate = Math.floor(toDate.getTime() / 1000);

                const headers = {
                    'Authorization': localStorage.getItem('AccessToken')
                }

                console.log(headers)

                const response = await axios.get(
                    `${process.env.REACT_APP_URL}/timetable/${slug}?from_time=${epochFromDate}&to_time=${epochToDate}`,
                    {headers: headers}
                    );

                const data = response.data;

                console.log(data)
                setWorkingHours(data.working_hours);
                setAuthorised(data.authorised);

            } catch (error) {

                console.log(error)
                const errorResponse = error.response;
                console.log(errorResponse)
                const statusCode = errorResponse.statusCode;
                if (statusCode === 404) {

                    // Show invalid url error
                    console.log('not found')

                }

            }

        }

        fetchTimetableData()

    }, []);

    const { coachSlug } = useParams();
    const [view, setView] = useState("day");

    const [isBookLessonModalOpen, setIsBookLessonModalOpen] = useState(false);

    const [startTime, setStartTime] = useState(10);
    const [endTime, setEndTime] = useState(22);

    const [fromDate, setFromDate] = useState(new Date());
    const toDate = new Date(new Date(fromDate).setDate(fromDate.getDate() + (view === "day" ? 0 : 6)));

    const formattedDateRange = view === "day"
        ? `${fromDate.getDate()}th ${fromDate.toLocaleString('default', { month: 'short' })}`
        : `${fromDate.getDate()}th-${toDate.getDate()}th ${fromDate.toLocaleString('default', { month: 'short' })}`;

    const getPreviousMonday = (date) => {
        const day = date.getDay();
        const difference = day === 0 ? 6 : day - 1;
        const newDate = new Date(date);
        newDate.setDate(date.getDate() - difference);
        return newDate;
    };

    const handleSetView = (newView) => {
        if (newView === "week") {
            setFromDate(prevDate => getPreviousMonday(prevDate));
        }
        setView(newView);
    };

    const handlePrevious = () => {
        setFromDate(prevDate => {
            const newDate = new Date(prevDate);
            if (view === "day") {
                newDate.setDate(newDate.getDate() - 1);
            } else {
                newDate.setDate(newDate.getDate() - 7);
            }
            return newDate;
        });
    };

    const handleNext = () => {
        setFromDate(prevDate => {
            const newDate = new Date(prevDate);
            if (view === "day") {
                newDate.setDate(newDate.getDate() + 1);
            } else {
                newDate.setDate(newDate.getDate() + 7);
            }
            return newDate;
        });
    };

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            padding: 10
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
                    lessonTypes={lessonTypes}
                    bookings={bookings}
                    workingHours={workingHours}
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
            </TitleSection>
            <Timetable  
                startTime={startTime} 
                endTime={endTime} 
                fromDate={fromDate.toISOString().split('T')[0]} 
                toDate={toDate.toISOString().split('T')[0]} 
                view={view} 
                workingHours={workingHours}
            />

        </div>
    );
}
