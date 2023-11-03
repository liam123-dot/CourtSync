import React, { createContext, useContext } from 'react';

const BookingCancellationContext = createContext(null);

export const useBookingCancellation = () => useContext(BookingCancellationContext);

export const BookingCancellationProvider = ({ children, setBookings }) => {

    const cancelBooking = (bookingId) => {
        setBookings((prevBookings) => prevBookings.map((booking) => {
            if (booking.booking_id === bookingId) {
                return { ...booking, status: 'cancelled' };
            }
            return booking;
        }));
    };

    // Provide the cancelBooking function and the bookings state through context
    const value = {
        setBookings
    };

    return (
        <BookingCancellationContext.Provider value={value}>
            {children}
        </BookingCancellationContext.Provider>
    );
};
