import GreyedOutObject from "./GreyedOutObject";
import BookingComponent, { BookingObject } from "./BookingObject";
import { CoachEventObject } from "./CoachEventObject";
import WorkingHoursComponent, { WorkingHoursObject } from "./WorkingHoursObject";
import { useRef } from "react";


export default function Column({ coachView, globalStartTime, globalEndTime, timetableObjects, dayView }) {
    const columnRef = useRef(null);

    return (
        <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(0,0,0,1)',
            flex: dayView ? 7: 1,
            minWidth: '120px',
            backgroundColor: 'white',
            position: 'relative'
        }}
            ref={columnRef}
        >

        {
            timetableObjects && (
            coachView ? (
                timetableObjects.map((timetableObject, index) => {
                    // Return a component here

                    if (timetableObject instanceof BookingObject) {
                        // timetableObject is an instance of BookingObject
                        // Add your code here for handling BookingObject instances
                        return (
                            <BookingComponent
                                key={index}
                                columnStartTime={globalStartTime}
                                columnEndTime={globalEndTime}
                                booking={timetableObject}
                            />
                        )
                    } else if (timetableObject instanceof CoachEventObject) {
                    
                    } else if (timetableObject instanceof WorkingHoursObject) {
                        
                        return (
                            <WorkingHoursComponent
                                key={index}
                                columnStartTime={globalStartTime}
                                columnEndTime={globalEndTime}
                                workingHours={timetableObject}
                            />
                        )

                    }
                })
            ) : (
                timetableObjects.map((timetableObject, index) => {
                    return (
                        <GreyedOutObject 
                            key={index} 
                            columnStartTime={globalStartTime}
                            columnEndTime={globalEndTime}
                            timetableObject={timetableObject}
                        />
                    )
                })
            )
            )
        }

        </div>
    )
    
}