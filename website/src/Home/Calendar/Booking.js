import React, { useState, useEffect } from 'react';
import { calculateTopAndHeight } from './CalculateTopAndHeight';
import LessonDetailsModal from './LessonDetailsModal';

const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };
  
function Booking({ columnStartTime, columnEndTime, booking, authorised }) {

    const [isLessonDetailsModalOpen, setIsLessonDetailsModalOpen] = useState(false);

    const toggleModal = () => {
      if (authorised){
        setIsLessonDetailsModalOpen(!isLessonDetailsModalOpen);
      }
    };

    const startTime = booking.start_time;
    const duration = booking.duration;
    const endTime = startTime + duration;
  
    const [top, setTop] = useState(0);
    const [height, setHeight] = useState(0);
    const [formattedStartTime, setFormattedStartTime] = useState('');
    const [formattedEndTime, setFormattedEndTime] = useState('');

    const [isCancelled, setIsCancelled] = useState(false);
    const [backgroundColor, setBackgroundColor] = useState('lightblue')
  
    useEffect(() => {

      if (booking.status === 'cancelled') {
        // Use a linear gradient to create diagonal stripes
        setIsCancelled(true);
      }

      const calculatePercents = () => {
        const columnStartTimeMinutes = columnStartTime * 60;
        const columnEndTimeMinutes = columnEndTime * 60;
    
        const percents = calculateTopAndHeight(columnStartTimeMinutes, columnEndTimeMinutes, startTime, endTime);
        setTop(percents.top);
        setHeight(percents.height);
        
        // Set formatted start and end times
        setFormattedStartTime(formatTime(startTime));
        setFormattedEndTime(formatTime(endTime));
      };
      calculatePercents();
    }, [columnStartTime, columnEndTime, startTime, endTime, duration]);
  
    const bookingDetails = (
      <>
        <div style={{
          padding: '2px 5px',
          backgroundColor: '#fff',
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
          textAlign: 'center',
          fontWeight: 'bold',
        }}>
          {formattedStartTime} - {formattedEndTime}
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
            <div>{booking.player_name}</div>
            <div>{booking.duration} Minutes</div>
          </div>
          <div style={{
            position: 'absolute',
            right: '5px', // Positioned to the right
            bottom: '5px', // Positioned to the bottom
            textAlign: 'right',
          }}>
          </div>
        </div>
      </>
    );

    const authroisedStyles = authorised && ((booking.filtersApplied && booking.filtered) || !booking.filtersApplied);
      const style = {
      position: 'absolute',
      top: `${top}%`,
      left: `${booking.position}%`,
      height: `${height}%`,
      zIndex: 2,
      width: `${booking.width}%`,
      backgroundImage: isCancelled ? 'repeating-linear-gradient(45deg, #ffcccc, #ffcccc 2px, #ffffff 2px, #ffffff 6px)' : 'none', // Changed from backgroundColor to backgroundImage
      backgroundColor: authroisedStyles ? 'lightblue': 'lightgrey',
      borderRadius: authroisedStyles ? 10 : 0,
      boxSizing: 'border-box',
      border: authroisedStyles ? '1px solid #0099ff' : 'none',
      color: authroisedStyles ? '#000' : '#fff',
    };
  
    return (
      <>
        {/* {((booking.filtersApplied && booking.filtered) || !booking.filtersApplied) ? ( */}
          <>
            <div onClick={toggleModal} style={{
              ...style, // existing styles
              cursor: 'pointer', // Add cursor style for hover effect
            }}>
              {authroisedStyles ? bookingDetails: null}
              {/* {authorised ? bookingDetails : null} */}
            </div>
            <LessonDetailsModal
              isOpen={isLessonDetailsModalOpen}
              onClose={() => setIsLessonDetailsModalOpen(false)}
              booking={booking}
            />
          </>
        {/* ) : null} */}
      </>
    );
}
    
      
export default Booking;