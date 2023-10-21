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
import GetDaysBetweenDates from '../GetDaysBetweenDates';


function ColumnTitles({ titles }) {

    const titleStyle = {
        border: '1px solid rgba(0,0,0,1)',
        padding: '4px',
        textAlign: 'center',
        minWidth: '120px',
        flex: 1,
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'row',

        }}>
            <div style={titleStyle}></div>
            {
                titles.map((title, index) => {
                    
                    return (
                        <div style={titleStyle} key={index}>
                            <p>
                                {title}
                            </p>

                        </div>
                    )

                })
            }
        </div>
    )

}

function RowTitles ({ titles, columnN }) {
    const titleStyle = {
        padding: '5px',
        minWidth: '120px',
        textAlign: 'center',
        flex: 1,
        border: '0.5px solid rgba(0,0,0,1)',
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            width: `${100.0 / columnN}%`,
            minWidth: '120px',
            flex: 1  // This will make it take up the remaining space
        }}>
            {
                titles.map((title, index) => {
                    
                    return (
                        <div style={titleStyle} key={index}>

                            <p>{title}</p>

                        </div>
                    )

                })
            }
        </div>
    )
}

function WorkingHour({startTime, columnStartTime, endTime, columnEndTime, myRef}) {

    const [columnHeight, setColumnHeight] = useState(0);

    useEffect(() => {
  const handleResize = () => {
    if (myRef.current) {
      setColumnHeight(myRef.current.offsetHeight);
    }
  };

  window.addEventListener('resize', handleResize);
  handleResize(); // Call it immediately to set the initial value

  return () => {
    // Cleanup the event listener on component unmount
    window.removeEventListener('resize', handleResize);
  };
}, []);

    columnStartTime = columnStartTime * 60;
    columnEndTime = columnEndTime * 60;

    let top;
    
    if (columnStartTime > startTime){

        top = 0;

    } else {

        top = ((startTime - columnStartTime) / (columnEndTime - columnStartTime)) * 100

    }
    
    const bottom = ((columnEndTime - endTime) / (columnEndTime - columnStartTime)) * 100

    const height = 100-top-bottom;

    top = (top / 100) * columnHeight;

    const style = {
        marginTop: `${top}px`,
        height: `${height}%`,
        backgroundColor: 'white',
    }
    
    return (
        <div style={style}></div>
    )

}


// Working hours have start_time and end_time which are represented in minutes
function Column({ workingHours, startTime, endTime}) {
    const columnRef = useRef(null);

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(0,0,0,1)',
        flex: 1,
        minWidth: '120px',
        backgroundColor: 'lightgrey'
      }}
      ref={columnRef}
      >

        <WorkingHour
            columnStartTime={startTime}
            columnEndTime={endTime}
            startTime={workingHours['start_time']}
            endTime={workingHours['end_time']}
            myRef={columnRef}
        ></WorkingHour>

      </div>
    );
  }

  function Timetable({ startTime, endTime, workingHours, fromDate, toDate }) {
    const columnTitles = GetDaysBetweenDates(fromDate, toDate);
    

      // Calculate global start and end times based on provided working hours
    let globalStartTime = 24 * 60; // set to max possible value initially (23:59 in minutes)
    let globalEndTime = 0; // set to min possible value initially (00:00 in minutes)
    
    Object.values(workingHours).forEach(wh => {
        console.log(wh)
        if (wh.start_time < globalStartTime) {
            globalStartTime = wh.start_time;
        }
        if (wh.end_time > globalEndTime) {
            globalEndTime = wh.end_time;
        }
    });
    console.log(globalStartTime, globalEndTime)

    globalStartTime /= 60;
    globalEndTime /= 60;
    console.log(globalStartTime, globalEndTime)

    // const globalStartTime = startTime;
    // const globalEndTime = endTime

    // Create row titles based on global start and end times
    const rowTitles = Array.from({ length: (globalEndTime - globalStartTime) }, (_, i) => i + globalStartTime);
  

    return (
      <div style={{
        boxSizing: 'border-box',
        overflowX: 'auto',
        overflowY: 'auto',
        border: '1px solid rgba(0,0,0,1)',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <ColumnTitles titles={columnTitles} />  {/* Adding an empty header for row titles */}
        <div style={{ display: 'flex', flexDirection: 'row', flexGrow: 1 }}>
          <RowTitles titles={rowTitles} columnN={columnTitles.length} />
          {columnTitles.map((title, colIndex) => (
            <Column 
                title={title} 
                key={colIndex} 
                rowTitles={rowTitles} 
                workingHours={workingHours[colIndex.toString()]}
                startTime={globalStartTime}
                endTime={globalEndTime}
            />
          ))}
        </div>
      </div>
    );
  }



export default Timetable;