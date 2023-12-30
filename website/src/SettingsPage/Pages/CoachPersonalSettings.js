import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChangePasswordScreen from '../../Authentication/ChangePasswordScreen';

const dividerStyle = {
    borderTop: '1px solid #ccbfbe',
    borderBottom: '1px solid #ccbfbe',
    paddingBottom: '10px'
}

export default function CoachPersonalSettings () {

    const [coachDetails, setCoachDetails] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const fetchCoachDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_API_URL}/user/me`,
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );
            const data = response.data;
            setCoachDetails(data);

        } catch (error) {
            console.error("Error fetching coach details", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchCoachDetails();
    }, []);

    return (
        <div>
            <div style={dividerStyle}>
                <p><strong>First Name: </strong> 
                    {isEditing ? (
                        <input type="text" name="first_name" value={coachDetails.first_name} onChange={handleInputChange} />
                    ) : (
                        coachDetails.first_name
                    )}
                </p>
            </div>
            <div style={dividerStyle}>
                <p><strong>Last Name: </strong> 
                    {isEditing ? (
                        <input type="text" name="last_name" value={coachDetails.last_name} onChange={handleInputChange} />
                    ) : (
                        coachDetails.last_name
                    )}
                </p>
            </div>
            <div style={dividerStyle}>
                <p><strong>Email: </strong> 
                    {isEditing ? (
                        <input type="text" name="email" value={coachDetails.email} onChange={handleInputChange} />
                    ) : (
                        coachDetails.email
                    )}
                </p>
            </div>
            <ChangePasswordScreen/>
        </div>
    )

}
