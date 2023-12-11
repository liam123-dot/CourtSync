import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import ProfileButton from "../../SidePanel/ProfilePicture";
import {Spinner} from "../../Spinner"
import {SaveButton} from '../../Home/CommonAttributes/SaveButton'
import { usePopup } from "../../Notifications/PopupContext";
import {useNavigate} from 'react-router-dom';

export default function CoachProfileSettings() {
    const [initialCoachDetails, setInitialCoachDetails] = useState(null);
    const [coachDetails, setCoachDetails] = useState(null);

    const [profileImage, setProfileImage] = useState(null); // State to hold selected image
    const [isLoading, setIsLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);

    const [coachLink, setCoachLink] = useState('');
    const [coachSetUp, setCoachSetUp] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const {showPopup} = usePopup();

    const fileInputRef = useRef(null);

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const saveDetails = async () => {
        setIsSaving(true);

        try {
            const changes = Object.keys(coachDetails).reduce((result, key) => {
                if (coachDetails[key] !== initialCoachDetails[key]) {
                    result[key] = coachDetails[key];
                }
                return result;
            }, {});

            console.log(changes);

            const response = await axios.put(`${process.env.REACT_APP_API_URL}/user/me`, 
                changes,
                {headers: {
                    'Authorization': localStorage.getItem('AccessToken')
                }}
            )
            console.log(response);
            showPopup('Success');
            setIsEditing(false);

        } catch (error) {
            console.log(error);
        }

        setIsSaving(false);
    }

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
            setInitialCoachDetails(data);
            
            setCoachLink(`${process.env.REACT_APP_WEBSITE_URL}/#${data.slug}`);
            setCoachSetUp(data.coach_setup);

        } catch (error) {
            console.error("Error fetching coach details", error);
        }
        setIsLoading(false);
    };

    useEffect(() => {

        fetchCoachDetails();
    }, []);

    const dividerStyle = {
        borderTop: '1px solid #ccbfbe',
        borderBottom: '1px solid #ccbfbe',
        paddingBottom: '10px'
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfileImage(file);
            handleImageUpload(file); // Automatically call upload function
        }
    };

    const handleImageUpload = async (file) => {

        const contentType = file.type;
    
        try {
            // 1. Fetch the pre-signed URL from the server
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/post-profile-picture-url`, {
                headers: {
                    'Authorization': localStorage.getItem('AccessToken')
                }
            });

            const presignedUrl = response.data.url; // Assuming the response contains the URL under the 'url' key
    
            if (!presignedUrl) {
                console.error("No pre-signed URL returned from server");
                return;
            }

            console.log('uploading')
    
            // 2. Use the pre-signed URL to upload the image to S3
            const s3Response = await axios.put(presignedUrl, file, {
                headers: {
                    'Content-Type': file.type
                }
            });

            console.log(s3Response)

            fetchCoachDetails();
            showPopup('Success');
            // 3. Optional: Refresh the profile image or coach details after successful upload

            // (e.g., by re-fetching coach details or setting the new profile image in your state)
    
        } catch (error) {
            console.error("Error uploading profile image", error);
        }
    }

    const handleSignOut = () => {

        localStorage.setItem('AccessToken', "");
        localStorage.setItem('RefreshToken', "");
        localStorage.setItem('email', "")

        navigate('/')

    }
    
    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setCoachDetails(prevDetails => ({
            ...prevDetails,
            [name]: value
        }));
    };

    return !isLoading ? (
        <div>
            <div style={dividerStyle}>
                <p>Your Profile Picture, (click to change/upload):</p>
                {/* Trigger file input on ProfileButton click */}
                <ProfileButton imageUrl={coachDetails?.profile_picture_url} size={200} onClick={triggerFileInput}/>
                {/* Hidden file input */}
                <input type="file" ref={fileInputRef} accept=".jpg, .jpeg, .png" style={{ display: 'none' }} onChange={handleImageChange} />
            </div>
            <p>
                Your name and bio will be shown to players when they book lessons with you.
                You can optionally show your email and phone number publicly so that players can contact you.
                Note that your phone number has to be shown to players on invoices that are sent.
            </p>
            {coachDetails && (
                <>
                    <div style={dividerStyle}>
                        <p><strong>Name:</strong> 
                            {coachDetails.first_name} {coachDetails.last_name}
                        </p>
                    </div>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                    }}>
                        <p><strong>Bio:</strong> 
                            {isEditing ? (
                                <textarea name="bio" value={coachDetails.bio} onChange={handleInputChange} />
                            ) : (
                                coachDetails.bio
                            )}
                        </p>
                        
                        <SaveButton onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel' : 'Edit'}
                        </SaveButton>
                    </div>

                    <div style={dividerStyle}>
                        {coachSetUp ? (
                            <p>
                                Share this link with your players to allow them to book lessons with you: <br/>
                                <a href={coachLink}>{coachLink}</a>
                            </p>
                        ): (
                            <p>

                                First you must set some working hours, durations and prices for your lessons. <br/>

                            </p>
                        )
                        }
                    </div>
                </>
            )}
            <SaveButton onClick={() => setIsEditing(!isEditing)}>
                {isEditing ? 'Cancel' : 'Edit'}
            </SaveButton>
            <SaveButton onClick={saveDetails}>
                {isSaving ? <Spinner/>: 'Save'}
            </SaveButton>
            <SaveButton onClick={handleSignOut}>
                Sign Out
            </SaveButton>
        </div>
    ): (
        <>
            <div>
                loading
            </div>
        </>
    )
}
