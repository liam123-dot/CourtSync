import React, { useState } from "react";

export default function Searchbar({ bookings, setBookings }) {
  // State for the search query input
  const [searchQuery, setSearchQuery] = useState('');
  // State for the filtered search results
  const [filteredResults, setFilteredResults] = useState([]);

  // Handler for search input changes
  const handleSearch = (event) => {
    let filtered = [];
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    
    Object.keys(bookings).forEach((key) => {
        bookings[key].forEach((booking) => {
            if (booking.player_name.toLowerCase().startsWith(query)){                
                filtered.push(booking.player_name);
            }
        });
    });

    setFilteredResults(filtered);
  };

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
          {filteredResults.map((playerName, index) => (
            <li key={index} style={{
                padding: '10px', // Add padding for each item
                borderBottom: '1px solid #ddd', // Add separator between items
                cursor: 'pointer' // Changes the cursor on hover
            }}>
              {playerName}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
