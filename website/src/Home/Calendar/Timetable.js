import React, {useEffect, useState} from "react";
import ColumnTitles from "./ColumnTitles";
import RowTitles from "./RowTitles";
import Column from "./Column";

function Timetable({fromDate, toDate, min, max, view, timetableObjects, coachView}) {

    // The timetableObjects is an array of dates in dd-mm-yyyy format to a list of timetableObjects for that day
    // each timetableObject has a start time being minutes from start of the day and a duration in minutes.
    // then we can check the type of timetable objects to see if it is a booking, or coach event or working hour
    // and render accordingly

    const generateDateToDayMap = (fromDate, toDate) => {
        const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const map = {};
    
        let currentDate = new Date(fromDate);
        while (currentDate <= toDate) {
            const key = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
            const value = dayNames[currentDate.getDay()];
            map[key] = value;
    
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return map;
    }
    
    const generateDateArray = (fromDate, toDate) => {
        const dates = [];
    
        let currentDate = new Date(fromDate);
        while (currentDate <= toDate) {
            const key = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
            dates.push(key);
    
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    }

    const [columnTitles, setColumnTitles] = useState([]);
    const [rowTitles, setRowTitles] = useState([]);

    const [dates, setDates] = useState([]);

    // useEffect(() => {
    //     console.log(timetableObjects)
    // }, [timetableObjects]) 

    useEffect(() => {

        if (fromDate && toDate) {

            setColumnTitles(generateDateToDayMap(fromDate, toDate));
            setRowTitles(Array.from({ length: (max - min) }, (_, i) => i + min));

            setDates(generateDateArray(fromDate, toDate));
        }
    }, [fromDate, toDate])
    return (
        <div style={{
            position: 'relative',
            boxSizing: 'border-box',
            overflowX: 'auto',
            overflowY: 'auto',
            border: '1px solid rgba(0,0,0,1)',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <ColumnTitles titles={columnTitles} dates={dates} view={view} />
            {
                rowTitles && (
                    <div style={{display: 'flex', flexDirection: 'row', flexGrow: 1}}>

                        <RowTitles titles={rowTitles} columnN={dates.length} view={view} />

                        {
                            dates.map((date, index) => (

                                <Column
                                    key={index}
                                    coachView={coachView}
                                    timetableObjects={timetableObjects[date]}
                                    globalStartTime={min}
                                    globalEndTime={max}
                                />

                            ))
                        }

                    </div>
                )
            }
        </div>
    )

}

export default Timetable;