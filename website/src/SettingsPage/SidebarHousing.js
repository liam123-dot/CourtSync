import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SidebarItem = ({ title, onSelect }) => (
    <div onClick={() => onSelect(title)} style={{ padding: '10px', cursor: 'pointer' }}>
        {title}
    </div>
);

    const Sidebar = ({ items, onSelect }) => (
    <div style={{ width: '150px', background: '#f0f0f0', padding: '10px' }}>
        {items.map((item) => (
        <SidebarItem key={item} title={item} onSelect={onSelect} />
        ))}
    </div>
);

export default function SidebarHousing ({firstSelected, _titles, _components, _endpoints}) {
    const [selected, setSelected] = useState(firstSelected);
    const [titles, setTitles] = useState(_titles);
    const [components, setComponents] = useState(_components);

    const [selectedIndex, setSelectedIndex] = useState(null);
  
    const updateTitle = (oldTitle, newTitle) => {
      setTitles((prevTitles) => 
        prevTitles.map((title) => (title === oldTitle ? newTitle : title))
      );
    };

    useEffect(() => {
        checkEndpoint();
    }, []);

    const checkEndpoint = async () => {

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            console.log(response);

            const data = response.data;

            // iterate through the endpoints, check if that variable exists in the response
            // if it does, check if it's false
            // if it's false, add the error message to the sidebar item
            // if it's true, remove the error message from the sidebar item
            // if it doesn't exist, do nothing

            for (const endpoint of _endpoints) {
                if (data[endpoint] === false) {
                    const index = _endpoints.indexOf(endpoint);
                    const title = _titles[index];
                    updateTitle(title, `${title} - Requires Setup`);
                } else {
                    // if requires setup is already in the title, remove it
                    const index = _endpoints.indexOf(endpoint);
                    const title = _titles[index];

                    console.log(title)

                    updateTitle(`${title} - Requires Setup`, title)

                }
                
            }

        } catch (error) {
            // Handle the error
            console.error(error);
        }

    }
    
    useEffect(() => {
        const index = titles.indexOf(selected);
        setSelectedIndex(index);
    
    }, [selected, titles])

    const SelectedContent = selectedIndex !== null && components[selectedIndex];  

    return (
      <div style={{ display: 'flex' }}>
        <Sidebar items={titles} onSelect={setSelected} />
        <div style={{ flex: 1, padding: '10px' }}>
            {SelectedContent && <SelectedContent refresh={checkEndpoint}/>}
        </div>
      </div>
    );
};
