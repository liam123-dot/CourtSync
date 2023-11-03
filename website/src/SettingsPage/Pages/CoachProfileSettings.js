import React, { useState, useEffect } from "react";
import axios from "axios";
import ProfileButton from "../../SidePanel/ProfilePicture";
import {Spinner} from "../../Spinner"
import {SaveButton} from '../../Home/CommonAttributes/SaveButton'

export default function CoachProfileSettings() {
    const [coachDetails, setCoachDetails] = useState(null);
    const [profileImage, setProfileImage] = useState(null); // State to hold selected image
    const [isLoading, setIsLoading] = useState(false);

    const [isSaving, setIsSaving] = useState(false);

    const saveDetails = async () => {
        setIsSaving(true);

        try {

            console.log(coachDetails);

            const response = await axios.post(`${process.env.REACT_APP_URL}/auth/coach/me`, 
                coachDetails,
                {headers: {
                    'Authorization': localStorage.getItem('AccessToken')
                }}
            )
            console.log(response);

        } catch (error) {
            console.log(error);
        }

        setIsSaving(false);
    }

    const fetchCoachDetails = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                `${process.env.REACT_APP_URL}/auth/coach/me`,
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );
            setCoachDetails(response.data);
            console.log(response.data);
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
        setProfileImage(e.target.files[0]);
    }

    const handleImageUpload = async () => {
        if (!profileImage) {
            console.error("No image selected for upload");
            return;
        }

        const contentType = profileImage.type;
    
        try {
            // 1. Fetch the pre-signed URL from the server
            const response = await axios.get(`${process.env.REACT_APP_URL}/auth/coach/profile-picture-upload-url`, {
                headers: {
                    'Authorization': localStorage.getItem('AccessToken')
                }
            });

            console.log(response)
    
            console.log(profileImage.type)
            const presignedUrl = response.data.url; // Assuming the response contains the URL under the 'url' key
    
            if (!presignedUrl) {
                console.error("No pre-signed URL returned from server");
                return;
            }
    
            // 2. Use the pre-signed URL to upload the image to S3
            const s3Response = await axios.put(presignedUrl, profileImage, {
                headers: {
                    'Content-Type': profileImage.type
                }
            });

            fetchCoachDetails();
            setProfileImage(null);
            // 3. Optional: Refresh the profile image or coach details after successful upload
            // (e.g., by re-fetching coach details or setting the new profile image in your state)
    
        } catch (error) {
            console.error("Error uploading profile image", error);
        }
    }
    

    return !isLoading ? (
        <div>
            <div style={dividerStyle}>
                <p>Your Profile Picture, (click to change/upload):</p>
                <ProfileButton imageUrl={coachDetails?.profile_picture_url} size={200}/>
                <input type="file" accept=".jpg, .jpeg, .png" onChange={handleImageChange} />
                <button onClick={handleImageUpload}>Upload</button>
            </div>
            {coachDetails && (
                <>
                    <div style={dividerStyle}>
                        <p><strong>First Name:</strong> {coachDetails.given_name}</p>
                    </div>

                    <div style={dividerStyle}>
                        <p><strong>Last Name:</strong> {coachDetails.family_name}</p>
                    </div>

                    <div style={dividerStyle}>
                        <p>
                            <strong>Email:</strong> {coachDetails.email}
                            {coachDetails.email_verified === "true" ? (
                                <span style={{ color: 'green', marginLeft: '10px' }}>(Verified)</span>
                            ) : (
                                <span style={{ color: 'red', marginLeft: '10px' }}>(Not Verified)</span>
                            )}
                            <br/>
                            Show Publicly:
                            <input
                                type="checkbox"
                                checked={coachDetails.show_email_publicly}
                                onChange={() => {
                                    setCoachDetails(prevDetails => ({
                                        ...prevDetails,
                                        show_email_publicly: !prevDetails.show_email_publicly
                                    }));
                                }}
                            />
                        </p>
                    </div>

                    <div style={dividerStyle}>
                        <p>
                            <strong>Phone Number:</strong> {coachDetails.phone_number}
                            {coachDetails.phone_number_verified === "true" ? (
                                <span style={{ color: 'green', marginLeft: '10px' }}>(Verified)</span>
                            ) : (
                                <span style={{ color: 'red', marginLeft: '10px' }}>(Not Verified)</span>
                            )}
                            <br/>
                            Show Publicly: 
                            <input 
                                type="checkbox"
                                checked={coachDetails.show_phone_number_publicly}
                                onChange={() => {
                                    setCoachDetails(prevDetails => ({
                                        ...prevDetails,
                                        show_phone_number_publicly: !prevDetails.show_phone_number_publicly
                                    }));
                                }}
                            />
                        </p>
                    </div>
                </>
            )}
            <SaveButton onClick={saveDetails}>
                {isSaving ? <Spinner/>: 'Save'}
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
