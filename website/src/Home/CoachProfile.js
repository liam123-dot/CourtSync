import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function CoachProfileWidget({ coachSlug, shown }) {
    const [name, setName] = useState(null);
    const [bio, setBio] = useState(null);
    const [profilePictureUrl, setProfilePictureUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // State for loading status

    useEffect(() => {
        const fetchCoachDetails = async () => {
            setIsLoading(true); // Set loading to true when fetch starts
            try {
                const url = `${process.env.REACT_APP_API_URL}/user/${coachSlug}/public-profile`;
                const response = await axios.get(url);
                const data = response.data;

                setName(data.name);
                setBio(data.bio);
                setProfilePictureUrl(data.profile_picture_url);                
            } catch (error) {
                console.error("Error fetching coach details:", error);
            }
            setIsLoading(false); // Set loading to false when fetch ends
        };

        if (shown) {
            fetchCoachDetails();
        }

    }, [coachSlug, shown]);

    if (!shown || isLoading) {
        // Optionally, you can add a loading spinner or message here
        return null; // or return loading component
    }

    return (
        <div style={{
            position: 'relative',
            top: '10px',
            right: '10px',
            width: '300px',
            height: '500px', // Adjusted for dynamic content
            backgroundColor: 'white',
            padding: '10px', // Added for some padding
            zIndex: '100',
            border: '1px solid #ccc', // Optional border
            borderRadius: '5px', // Optional border radius for better aesthetics
        }}>
            {profilePictureUrl && (
                <img src={profilePictureUrl} alt="Coach Profile" style={{ width: '100%', height: 'auto', borderRadius: '50%' }} />
            )}
            {name && <h3>{name}</h3>}
            {bio && <p>{bio}</p>}
        </div>
    );
}
