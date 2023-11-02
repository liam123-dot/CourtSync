/*

What we can do is have initial search done by locally ran code, whilst have an asyncronous function
calling an endpoint that will do the search beyond the locally loaded data. Therefore something is 
shown instantly then can be updated in the next .5s to have all results. Will reduce the lag unless
the search items do not exist at all in locally stored data.

*/


import React, { useCallback, useState } from "react";

export default function Searchbar({ bookings, setBookings, selected, setSelected }) {
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState('');
  // State for the filtered search results
  const [filteredResults, setFilteredResults] = useState({});

  const handleBookingSelectionChange = (contactEmail, filteredValue) => {
    setBookings((currentBookings) => {
      // Create a new object to hold the updated bookings
      const updatedBookings = {};
  
      // Iterate over each key in the currentBookings object
      Object.keys(currentBookings).forEach((key) => {
        // Check if the current key has a list of bookings
        if (Array.isArray(currentBookings[key])) {
          // If so, map over that list to update the 'filtered' property
          updatedBookings[key] = currentBookings[key].map((booking) => {
            if (booking.contact_email === contactEmail) {
                if (filteredValue){
                    setSelected([...selected, contactEmail]);
                } else {
                    setSelected(prevSelected => {
                        // Check if the contactEmail is already in the selected array
                        const isAlreadySelected = prevSelected.includes(contactEmail);
                        console.log(isAlreadySelected);
                      
                        if (isAlreadySelected) {
                          // If it's already selected, filter it out
                          return prevSelected.filter(email => email !== contactEmail);
                        }
                      });
                      
                }
                return { ...booking, filtered: filteredValue };
            } else {
                return {...booking, filtered: false};
            }
            return booking;
          });
        }
      });
  
      // Return the updated bookings object
      return updatedBookings;
    });
  };


  // Handler for search input changes
  const handleSearch = (event) => {
    let filtered = {};
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    Object.keys(bookings).forEach((key) => {
      bookings[key].forEach((booking) => {
        if (booking.player_name.toLowerCase().startsWith(query)) {
          // Initialize the nested dictionary if it doesn't exist
          if (!filtered[booking.contact_email]) {
            filtered[booking.contact_email] = {};
          }
          // Add the booking to the nested dictionary, using the booking id as a key
          filtered[booking.contact_email][booking.id] = booking;
        }
      });
    });

    setFilteredResults(filtered);
  };

  // Pass `handleBookingSelection` down to `Searchbar` instead of `setBookings`

  // In Searchbar
  const selectName = useCallback((contactEmail) => {
    // Call the passed-in function from the parent component
    handleBookingSelectionChange(contactEmail, true);
    setFilteredResults({})
    // setSearchQuery('');
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        placeholder="Search players..."
        value={searchQuery}
        onChange={handleSearch}
        style={{
            fontSize: '18px', // Make sure to include units like px
            width: '100%', // This can be adjusted based on your design
            padding: '10px' // Add some padding for aesthetics
        }}
      />
      {searchQuery && (
        <ul style={{
            position: 'absolute', // This positions the dropdown over the content
            zIndex: 1000, // This ensures the dropdown is above other content
            width: '100%', // This should match the width of your input
            background: 'white', // Or any color that matches your design
            listStyleType: 'none', // Removes bullet points from the list
            margin: 0, // Resets default margin
            padding: 0, // Resets default padding
            borderTop: 'none', // Removes the top border if your input has a border
            maxHeight: '300px', // Set a max-height and use overflow for scroll
            overflowY: 'auto', // Adds a scrollbar if the content overflows
            boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)' // Optional: adds shadow for depth
        }}>
          {
            Object.entries(filteredResults).map(([contactEmail, bookingsDict], index) => (
              <div key={index} onClick={() => {
                selectName(contactEmail);
              }}>
                <h3>{contactEmail}</h3>
                <ul>
                  {Object.values(bookingsDict).map((booking) => (
                    <li key={booking.id}>
                      {booking.player_name} - {booking.start_time}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          }
        </ul>
      )}
      {
          selected && selected.map((contactEmail) => {
              return (
                  <button onClick={() => {
                      handleBookingSelectionChange(contactEmail, false);
                  }}>
                      {contactEmail}
                  </button>
              )                        
          })
      }
    </div>
  );
}
