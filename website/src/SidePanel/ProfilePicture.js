import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser } from '@fortawesome/free-solid-svg-icons';

function ProfileButton({ imageUrl, size = 50, onClick }) {
    const [imageFailed, setImageFailed] = useState(false);
    
    const renderImageContent = () => {
        if (imageUrl && !imageFailed) {
            return (
                <img
                    src={imageUrl}
                    alt="Profile"
                    onError={() => setImageFailed(true)}
                    style={{ width: '100%', height: '100%', borderRadius: '10%' }}
                />
            );
        }

        return (
            <FontAwesomeIcon 
                icon={faUser} 
                style={{ fontSize: `${size}px`, width: '100%', height: 'auto' }}
            />
        );
    };

    return (
        <button
            style={{
                border: 'none',
                background: 'transparent',
                padding: 0,
                cursor: 'pointer',
                width: `${size}px`,
                height: `${size}px`,
                display: 'flex',
                alignItems: 'center',
                // justifyContent: 'center',
            }}
            onClick={onClick}
        >
            {renderImageContent()}
        </button>
    );
}

export default ProfileButton;
