/*

What we can do is have initial search done by locally ran code, whilst have an asyncronous function
calling an endpoint that will do the search beyond the locally loaded data. Therefore something is 
shown instantly then can be updated in the next .5s to have all results. Will reduce the lag unless
the search items do not exist at all in locally stored data.

*/


import React, { useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function Searchbar({ bookings, setBookings, selected, setSelected }) {
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState('');
  const {coachSlug} = useParams();
  
  const handleSearch = async (e) => {

    const query = e.target.value;
    setSearchQuery(query);

    try{
      // post request to search endpoint

      const response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/${coachSlug}/filter?query=${query}`, {
        headers: {
          Authorization: localStorage.getItem("AccessToken")
        },
      });

      console.log(response.data);
  
    } catch (error) {
      console.log(error);
    }

  }

  // In Searchbar

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
      {/* {searchQuery && (
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
      } */}
    </div>
  );
}
