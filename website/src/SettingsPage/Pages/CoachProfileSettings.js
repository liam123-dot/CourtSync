import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button, Card, CardContent, CardActions, Grid, TextField, Typography, CircularProgress, Divider, Box, IconButton, TextareaAutosize, Switch, FormControlLabel, Modal } from '@mui/material';
import { Save as SaveIcon, Edit as EditIcon, Cancel as CancelIcon, Logout as LogoutIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';
import ProfileButton from "../../SidePanel/ProfilePicture";
import { usePopup } from "../../Notifications/PopupContext";
import { useNavigate } from 'react-router-dom';
import Tooltip from "@mui/material/Tooltip";
// 
export default function CoachProfileSettings() {
    const [initialCoachDetails, setInitialCoachDetails] = useState(null);
    const [coachDetails, setCoachDetails] = useState(null);

    const [profileImage, setProfileImage] = useState(null); // State to hold selected image
    const [isLoading, setIsLoading] = useState(false);

    const [isEditing, setIsEditing] = useState(false);

    const [coachLink, setCoachLink] = useState('');
    const [coachSetUp, setCoachSetUp] = useState(true);

    const [isImageUploading, setIsImageUploading] = useState(false);
    
    const [showEmailPublicly, setShowEmailPublicly] = useState(false);
    const [showPhoneNumberPublicly, setShowPhoneNumberPublicly] = useState(false);

    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const [showDescription, setShowDescription] = useState(false);

    const {showPopup} = usePopup();

    const fileInputRef = useRef(null);

    const triggerFileInput = () => {
        fileInputRef.current.click();
    };

    const saveDetails = async () => {
        setIsSaving(true);

        try {
            const detailsChanges = Object.keys(coachDetails).reduce((result, key) => {
                if (coachDetails[key] !== initialCoachDetails[key]) {
                    result[key] = coachDetails[key];
                }
                return result;
            }, {});

            const changes = {
                ...detailsChanges,
                show_email_publicly: showEmailPublicly,
                show_phone_number_publicly: showPhoneNumberPublicly
            };

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
            
            setCoachLink(`${process.env.REACT_APP_WEBSITE_URL}/#/${data.slug}`);

            setShowEmailPublicly(data.show_email_publicly);
            setShowPhoneNumberPublicly(data.show_phone_number_publicly);

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
        setIsImageUploading(true);
    
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
            const s3Response = await axios.post(presignedUrl, file, {
                headers: {
                    'Content-Type': file.type
                }
            });

            console.log(s3Response)

            showPopup('Success');
            await fetchCoachDetails();
            setIsImageUploading(false);
            // 3. Optional: Refresh the profile image or coach details after successful upload

            // (e.g., by re-fetching coach details or setting the new profile image in your state)
    
        } catch (error) {
            console.error("Error uploading profile image", error);
        }
        setIsImageUploading(false);
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
        <Box sx={{ maxWidth: 800, mx: 'auto', my: 4 }}>
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        Your Profile
                        <Tooltip title="All information on your profile is shown to players when they book lessons with you.">
                            <IconButton
                                onClick={() => setShowDescription(!showDescription)}
                            >
                                <FontAwesomeIcon icon={faInfo} />
                            </IconButton>  
                        </Tooltip>
                    </Typography>
                    <Box sx={{ my: 2, textAlign: 'center' }}>
                        {!isImageUploading ? 
                        <ProfileButton imageUrl={coachDetails?.profile_picture_url} size={200} onClick={triggerFileInput}/>
                        : <CircularProgress />}
                        <input type="file" ref={fileInputRef} accept=".jpg, .jpeg, .png" style={{ display: 'none' }} onChange={handleImageChange} />
                    </Box>
                    <Divider />
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="body1">All information on your profile is shown to players when they book lessons with you.</Typography>
                        {coachDetails && (
                            <>
                                <Typography variant="subtitle1"><strong>Name:</strong> {coachDetails.first_name} {coachDetails.last_name}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                                        <strong>Bio:</strong>
                                        {isEditing ? (
                                            <TextareaAutosize 
                                                minRows={3}
                                                name="bio" 
                                                value={coachDetails.bio} 
                                                onChange={handleInputChange}
                                                style={{ width: '100%' }}
                                            />
                                        ) : (
                                            coachDetails.bio
                                        )}
                                    </Typography>
                                </Box>
                                {isEditing ? (
                                    <Box>
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                    checked={showEmailPublicly} 
                                                    onChange={e => setShowEmailPublicly(e.target.checked)}
                                                />
                                            }
                                            label="Show email publicly"
                                        />
                                        <FormControlLabel
                                            control={
                                                <Switch 
                                                    checked={showPhoneNumberPublicly} 
                                                    onChange={e => setShowPhoneNumberPublicly(e.target.checked)}
                                                />
                                            }
                                            label="Show phone number publicly"
                                        />
                                    </Box>
                                ) : (
                                    <Box>
                                        {showEmailPublicly && <Typography variant="body2"><strong>Email:</strong> {coachDetails.email}</Typography>}
                                        {showPhoneNumberPublicly && <Typography variant="body2"><strong>Phone:</strong> {coachDetails.phone_number}</Typography>}
                                    </Box>
                                )}
                                <Box sx={{ mt: 2 }}>
                                    {coachSetUp ? (
                                        <Typography variant="body1">
                                            Players can book lessons with this link: <a href={coachLink}>{coachLink}</a>
                                        </Typography>
                                    ) : (
                                        <Typography variant="body1">
                                            {/* First you must set some working hours, durations, and prices... */}
                                        </Typography>
                                    )}
                                </Box>
                            </>
                        )}
                    </Box>
                </CardContent>
                <CardActions style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                        <Button startIcon={isEditing ? <CancelIcon /> : <EditIcon />} onClick={() => setIsEditing(!isEditing)}>
                            {isEditing ? 'Cancel' : 'Edit'}
                        </Button>
                        {isEditing && (
                            <Button startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />} onClick={saveDetails}>
                                Save
                            </Button>
                        )}
                    </div>
                    <Button startIcon={<LogoutIcon />} onClick={handleSignOut} color="error">
                        Sign Out
                    </Button>
                </CardActions>
            </Card>
        </Box>
    ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
}