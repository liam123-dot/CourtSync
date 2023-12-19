import React, { useState } from 'react';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import PersonIcon from '@mui/icons-material/Person';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

function ProfileButton({ imageUrl, size = 50, onClick }) {
    const [imageFailed, setImageFailed] = useState(false);

    const renderImageContent = () => {
        if (imageUrl && !imageFailed) {
            return (
                <Avatar
                    src={imageUrl}
                    alt="Profile"
                    onError={() => setImageFailed(true)}
                    sx={{ width: size, height: size }}
                />
            );
        }

        return (
            <PersonIcon sx={{ fontSize: size }} />
        );
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <IconButton
                onClick={onClick}
                sx={{
                    padding: 0,
                    width: size,
                    height: size,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {renderImageContent()}
            </IconButton>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                Click to change
            </Typography>
        </Box>
    );
}

export default ProfileButton;
