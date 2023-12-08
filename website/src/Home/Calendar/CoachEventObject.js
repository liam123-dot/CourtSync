import React, {useState, useEffect} from 'react';
import {TimetableEvent} from './TimetableEvent';
import { calculateTopAndHeight } from './CalculateTopAndHeight';
import { useCoachEventDetails } from './CoachEventDetailsContext';
import { useShowCancelled } from '../CoachHomeScreen/ShowCancelledContext';

const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

function convertEpochToDateString(epochSeconds) {
    const date = new Date(epochSeconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${day}/${month}/${year}`;
}

export class CoachEventObject extends TimetableEvent {

    constructor(id, startTime, duration, date, title, description, position, width, status, repeat_id, repeatFrequency, repeatUntil){
        super(id, startTime, duration, date);

        this.title = title;
        this.description = description;

        this.endTime = this.minutesIntoDay + duration;

        this.position = position;
        this.width = width;

        this.status = status;

        this.formattedStartTime = formatTime(this.minutesIntoDay);
        this.formattedEndTime = formatTime(this.endTime);
        console.log('ahaha')
        console.log(repeat_id)
        console.log(repeatFrequency)
        console.log(repeatUntil)

        this.repeat_id = repeat_id;
        this.repeatFrequency = repeatFrequency;
        this.repeatUntil = repeatUntil ? convertEpochToDateString(repeatUntil) : null;

    }

    // Additional methods and properties specific to CoachEventObject can be added here
}

export default function CoachEventComponent({columnStartTime, columnEndTime, coach}){

    const {setCoachEvent, setShown} = useCoachEventDetails();
    const {showCancelled, setShowCancelled} = useShowCancelled();

    const [top, setTop] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {

        const calculatePercents = () => {
            const columnStartTimeMinutes = columnStartTime * 60;
            const columnEndTimeMinutes = columnEndTime * 60;
    
            const percents = calculateTopAndHeight(columnStartTimeMinutes, columnEndTimeMinutes, coach.minutesIntoDay, coach.endTime);
            setTop(percents.top);
            setHeight(percents.height);
            
        };
        calculatePercents();

    }, [columnStartTime, columnEndTime, coach.startTime, coach.endTime, coach.duration, coach])

    if (coach.status === 'cancelled' && !showCancelled) return null;

    return (
        <div style = {{
            position: 'absolute',
            top: `${top}%`,
            left: `${coach.position}%`,
            height: `${height}%`,
            zIndex: 2,
            width: `${coach.width}%`,        
            backgroundColor: 'lightblue',
            backgroundImage: coach.status === 'cancelled' ? 'repeating-linear-gradient(45deg, #ffcccc, #ffcccc 2px, #ffffff 2px, #ffffff 6px)' : 'none', // Changed from backgroundColor to backgroundImage
            borderRadius: 10,
            boxSizing: 'border-box',
            border: '1px solid #0099ff',
            color: '#000',
            cursor: 'pointer',
        }}
        onClick={() => {
            setCoachEvent(coach);
            setShown(true);
        }}
        >        
            <div style={{
                    padding: '2px 5px',
                    backgroundColor: '#fff',
                    borderTopLeftRadius: 10,
                    borderTopRightRadius: 10,
                    textAlign: 'center',
                    fontWeight: 'bold',
                    }}>
                    {coach.formattedStartTime} - {coach.formattedEndTime}
                </div>
                <div style={{
                    padding: '5px',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    height: '100%',
                    }}>
                        <div style={{
                            position: 'absolute',
                            textAlign: 'left'
                        }}>
                            <div>{coach.title}</div>                            
                        </div>
                    <div style={{
                        position: 'absolute',
                        right: '5px', // Positioned to the right
                        bottom: '5px', // Positioned to the bottom
                        textAlign: 'right',
                    }}>
                </div>
            </div>
        </div>   
    )
}
