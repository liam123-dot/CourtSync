import { useEffect, useState } from "react"
import { calculateTopAndHeight } from './CalculateTopAndHeight';

export default function GreyedOutObject ({columnStartTime, columnEndTime, timetableObject}) {

    const [top, setTop] = useState(0);
    const [height, setHeight] = useState(0);

    useEffect(() => {

        const startTime = timetableObject.minutesIntoDay;
        const duration = timetableObject.duration;
        const endTime = startTime + duration;

        const calculatePercents = () => {
          const columnStartTimeMinutes = columnStartTime * 60;
          const columnEndTimeMinutes = columnEndTime * 60;
      
          const percents = calculateTopAndHeight(columnStartTimeMinutes, columnEndTimeMinutes, startTime, endTime);
          setTop(percents.top);
          setHeight(percents.height);
          
        };
        calculatePercents();
      }, [columnStartTime, columnEndTime, timetableObject]);
    

    return (
        <div style={{
            position: 'absolute',
            top: `${top}%`,            
            height: `${height}%`,
            zIndex: 1,
            width: '100%',
            backgroundColor: 'lightgrey',
            borderRadius: 0,
            boxSizing: 'border-box',
            border: 'none',
            color: '#fff',
        }}>



        </div>
    )

}
