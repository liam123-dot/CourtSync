import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import { checkRefreshRequired, Button, handlePrevious, handleNext, getStartEndOfWeek, ArrowButtonGroup, TitleSection, DateLabel, handleSetView } from "../HomescreenHelpers";
import GetDaysBetweenDates from "../GetDaysBetweenDates";
import ProfileButton from "../../SidePanel/ProfilePicture";
import BookLessonModal from "./BookLessonModal";
import { fetchTimetable } from "../FetchTimetable";
import {css, Global} from "@emotion/react";
import Timetable from "../Calendar/Timetable";
import { TimetableEvent } from "../Calendar/TimetableEvent";

export default function PlayerHomeScreen() {

    const {coachSlug} = useParams();

    const [fromDate, setFromDate] = useState(null);
    const [toDate, setToDate] = useState(null);

    const [view, setView] = useState("week");

    const [isBookLessonModalOpen, setIsBookLessonModalOpen] = useState(false);

    const [durations, setDurations] = useState(null);
    const [pricingRules, setPricingRules] = useState(null);

    const [formattedDateRange, setFormattedDateRange] = useState("");

    const [coachExists, setCoachExists] = useState(false);

    const [all, setAll] = useState({});
    const [timetableEvents, setTimetableEvents] = useState({});

    const [loadedDates, setLoadedDates] = useState([]);

    const [profilePictureUrl, setProfilePictureUrl] = useState('');

    const [min, setMin] = useState(null);
    const [max, setMax] = useState(null);

    const [coachAccountSetUp, setCoachAccountSetUp] = useState(false);

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

        const data = await fetchTimetable(fromDate, toDate, coachSlug, false);

        console.log(data)

        if (data.exists) {

            console.log(data);

            setAll(prevAll => ({
                ...prevAll,
                ...data.all
            }));

            setMin(data.global_min);
            setMax(data.global_max);

            setPricingRules(data.pricingRules);
            setDurations(data.durations);

            setCoachExists(true);
            const newDates = Object.keys(data.all)
            setLoadedDates(prevLoadedDates => [...prevLoadedDates, ...newDates]);

            setCoachAccountSetUp(data.coach_setup);

        } else {
            setCoachExists(false);
        }

    }

    useEffect(() => {
        const timetableEvents = Object.keys(all).reduce((events, key) => {
            const eventArray = all[key].map(item => new TimetableEvent(0, item.start_time, item.duration, key));
            return { ...events, [key]: eventArray };
        }, {});
        setTimetableEvents(timetableEvents);
    }, [all]);

    useEffect(() => {
        const calculateStartingDates = () => {

            const currentDate = new Date();
            
            const startAndEnd = getStartEndOfWeek(currentDate);

            setFromDate(startAndEnd.fromDate);
            setToDate(startAndEnd.toDate);

            return startAndEnd;

        }
                
        const dates = calculateStartingDates();
        fetchTimetableData(dates.fromDate, dates.toDate);
    }, [])

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

    return (!coachExists ? (
                <p>
                    No coach account exists with the provided url
                </p>
            ) : coachAccountSetUp ? (
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
                                durations={durations}
                                pricingRules={pricingRules}
                                coachSlug={coachSlug}
                                loadedDates={loadedDates}
                                redo={redo}
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
                            <ProfileButton imageUrl={profilePictureUrl}/>                        
                        </TitleSection>
                        <Timetable
                            coachView={false}
                            fromDate={fromDate}
                            toDate={toDate}
                            min={min}
                            max={max}
                            view={view}
                            timetableObjects={timetableEvents}
                        />                

                    </div>
            ): (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                    <h1 style={{textAlign: 'center'}}>
                        Coach has not fully set up their account yet. Please check back later.
                    </h1>
                </div>
            )
    )
    

}