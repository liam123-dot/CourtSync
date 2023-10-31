/*

Thinking about how to show the timetable. Currently, we have the row and column headers as independent
objects. That's fine as it is good to have them shown as they are now.

For the main timetable bit
Possible idea

Don't have it defined as a grid.
Could have 2 objects, background colours and events/slots.
The background colours can be used to shade in working and non-working hours, as well as adding borders
between the columns.
then events are rounded rectangles that can be clicked on and show more data.

Need to just look into the calculations that are required. If we have absolute positioning within the
timetable, there will have to be recalculating of widths and positions every time the user resizes.

But it allows for more control.

Maybe split into columns since events are much more likely to be continuous over the rows than over the
columns if it is the case that they are continuous over the columns.

the columns will be indexed in the order they're shown. Starting with 0.

each column will then have a key for each object type (2 right now).
one for background objects, and one for events. These keys will lead to lists of events that should
have most of the specifics pre-calculated server-side

*/

import React, { useRef, useState, useEffect } from 'react';
import Booking from './Booking';
import { calculateTopAndHeight } from './CalculateTopAndHeight';

function ColumnTitles({ titles, dayView }) {
    const titleStyle = {
        border: '1px solid rgba(0,0,0,1)',
        padding: '4px',
        textAlign: 'center',
        minWidth: '120px',
        flex: dayView ? 7: 1,
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',
        }}>
            <div style={{
                border: '1px solid rgba(0,0,0,1)',
                padding: '4px',
                textAlign: 'center',
                minWidth: '120px',
                flex: 1
            }}></div>
            {
                Object.values(titles).map((title, index) => (
                    <div style={titleStyle} key={index}>
                        <p>{title}</p>
                    </div>
                ))
            }
        </div>
    );
}

function RowTitles({ titles, columnN }) {
    const titleStyle = {
        padding: '5px',
        minWidth: '120px',
        textAlign: 'center',
        flex: 1,
        border: '0.5px solid rgba(0,0,0,1)',
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: `${100.0 / columnN}%`,
            minWidth: '120px',
            flex: 1
        }}>
            {
                titles.map((title, index) => (
                    <div style={titleStyle} key={index}>
                        <p>{title}</p>
                    </div>
                ))
            }
        </div>
    );
}

// should all be input as mintues


function WorkingHours({columnStartTime, columnEndTime, workingHour}){

  const [top, setTop] = useState(0);
  const [height, setHeight] = useState(0);

  // the working hours details in minutes

  const calculatePercents = () => {

    if (workingHour){

      const wHStartMinutes = workingHour.start_time;
      const wHEndMinutes = workingHour.end_time;

      const columnStartTimeMinutes = columnStartTime * 60;
      const columnEndTimeMinutes = columnEndTime * 60;

      const percents = calculateTopAndHeight(columnStartTimeMinutes, columnEndTimeMinutes, wHStartMinutes, wHEndMinutes);
      setTop(percents.top);
      setHeight(percents.height)

    }

  }

  useEffect(() => {
    calculatePercents();

  }, [workingHour])

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      backgroundColor: 'white',
      top: `${top}%`,
      height: `${height}%`,
      zIndex: 1,
    }}/>
  )

}

// Utility function to convert minutes to HH:MM format


function Column({ workingHours, startTime, endTime, bookings, authorised, dayView }) {
    const columnRef = useRef(null);

    let wHStartTime;
    let wHEndTime;
    if (workingHours && 'start_time' in workingHours && 'end_time' in workingHours) {
        wHStartTime = workingHours['start_time']
        wHEndTime = workingHours['end_time']
    } else {
        wHStartTime = null;
        wHEndTime = null;
    }

    bookings = bookings.map(booking => {
        let bookingDate = new Date(booking.start_time * 1000);
        let minutesIntoTheDay = bookingDate.getHours() * 60 + bookingDate.getMinutes();

        return {
            ...booking,
            start_time: minutesIntoTheDay
        };
    });

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid rgba(0,0,0,1)',
            flex: dayView ? 7: 1,
            minWidth: '120px',
            backgroundColor: 'lightgrey',
            position: 'relative'
        }}
            ref={columnRef}
        >
          <WorkingHours
            columnStartTime={startTime}
            columnEndTime={endTime}
            workingHour={workingHours}
          />
          {
            bookings.map((booking, index) => {
              return (
                <Booking
                  key={index}
                  columnStartTime={startTime}
                  columnEndTime={endTime}
                  booking={booking}
                  authorised={authorised}
                />
              )
            })
          }
        </div>
    );
}

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


function Timetable({ workingHours, bookings, fromDate, toDate, authorised }) {

    const [columnTitles, setColumnTitles] = useState([]);
    const [dates, setDates] = useState([]);

    const [rowTitles, setRowTitles] = useState([]);

    const [globalStartTime, setGlobalStartTime] = useState(null);
    const [globalEndTime, setGlobalEndTime] = useState(null);    

    const [loaded, setLoaded] = useState(false);

    const calculateGlobalTimes = () => {
    let minStartTime = 24 * 60;  // set to max possible value initially (23:59 in minutes)
    let maxEndTime = 0;         // set to min possible value initially (00:00 in minutes)

    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
          // Convert currentDate to dd-mm-yyyy format
          let formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;

          // Check if data for the key exists in workingHours
          if (workingHours && workingHours[formattedDate]) {
              let start = workingHours[formattedDate].start_time;
              let end = workingHours[formattedDate].end_time;

              if (start && end){

                if (start < minStartTime) minStartTime = start;
                if (end > maxEndTime) maxEndTime = end;

              }
          }
          

        // Move to the next day
        currentDate.setDate(currentDate.getDate() + 1);
    }
    // Convert minStartTime and maxEndTime from minutes to hours

    const start = Math.floor(minStartTime / 60)
    const end = Math.ceil(maxEndTime / 60)

    setGlobalStartTime(start);
    setGlobalEndTime(end);

    return {start: start, end: end}

    }

    useEffect(() => {
      setLoaded(false);
    }, [])

    useEffect(() => {
      if (fromDate && toDate) {
          // Reset the loaded state at the start of the effect
          setLoaded(false);
  
          setColumnTitles(generateDateToDayMap(fromDate, toDate));
          setDates(generateDateArray(fromDate, toDate));
          const temp = calculateGlobalTimes();
          const rowTitles = Array.from({ length: (temp.end - temp.start) }, (_, i) => i + temp.start);
          setRowTitles(rowTitles);
          
          // Set loaded to true at the end of the effect
          setLoaded(true);
      }
  }, [fromDate, toDate, workingHours]);

  const dayView = toDate.getDay() - fromDate.getDay() == 0;
  
    return (
      loaded ? (
        <div style={{
            boxSizing: 'border-box',
            overflowX: 'auto',
            overflowY: 'auto',
            border: '1px solid rgba(0,0,0,1)',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <ColumnTitles titles={columnTitles} dayView={dayView}/>
            {rowTitles && (
                <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
                    <RowTitles titles={rowTitles} columnN={columnTitles.length} />
                    {loaded && workingHours && columnTitles && dates.map((date, dateIndex) => (
                        <Column
                            title={columnTitles[date]}
                            key={date}
                            rowTitles={rowTitles}
                            workingHours={workingHours[date]}
                            startTime={globalStartTime}
                            endTime={globalEndTime}
                            bookings={bookings && date in bookings ? bookings[date]: []}
                            date={date}
                            authorised={authorised}
                            dayView={dayView}
                        />
                    ))}
                </div>
              )
            }
        </div>
      ) : (<>Loading</>)
    );
  }



export default Timetable;