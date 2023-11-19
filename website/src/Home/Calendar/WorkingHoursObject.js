import React, { useState, useEffect } from 'react';
import { TimetableEvent } from './TimetableEvent';
import { calculateTopAndHeight } from './CalculateTopAndHeight';

export class WorkingHoursObject extends TimetableEvent {

    constructor(id, startTime, duration, date){
        super(id, startTime, duration, date);

    }

    // Additional methods and properties specific to WorkingHoursObject can be added here
}

export default function WorkingHoursComponent({columnStartTime, columnEndTime, workingHours}) {

    const [top, setTop] = useState(0);
    const [height, setHeight] = useState(0);


    useEffect(() => {
    
          const calculatePercents = () => {
            const columnStartTimeMinutes = columnStartTime * 60;
            const columnEndTimeMinutes = columnEndTime * 60;
        
            const percents = calculateTopAndHeight(columnStartTimeMinutes, columnEndTimeMinutes, workingHours.minutesIntoDay, workingHours.endTime);
            setTop(percents.top);
            setHeight(percents.height);
            
          };
          calculatePercents();

    }, [columnStartTime, columnEndTime, workingHours.startTime, workingHours.endTime, workingHours.duration, workingHours])

    return (
        <div style={{
            position: 'absolute',
            top: `${top}%`,            
            height: `${height}%`,
            zIndex: 2,
            width: '100%',
            backgroundImage:  'none', // Changed from backgroundColor to backgroundImage
            backgroundColor: 'lightgrey',
            borderRadius: 0,
            boxSizing: 'border-box',
            border: 'none',
            color: '#fff',
        }}>



        </div>
    )

}