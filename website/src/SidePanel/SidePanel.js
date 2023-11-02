import React, { useEffect, useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import styled from '@emotion/styled';

import ProfileButton from './ProfilePicture';
import axios from 'axios';

const SidePanelContainer = styled.div`
    position: fixed;
    top: 0;
    right: ${props => (props.isOpen ? '0' : '-400px')};
    width: 400px;
    height: 100%;
    background-color: #333;
    transition: right 0.1s;
    overflow-y: auto;
    color: white;
    padding: 20px;
    z-index: 5;
`;

const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0);
    display: ${props => (props.isVisible ? 'block' : 'none')};
    zIndex: 5;
`;

const StyledLink = styled(Link)`
    text-decoration: none; // removes the underline
    color: white; // makes the text color white
    font-size: 40px;
    &:hover {
        color: #ddd; // changes color to a slightly darker white on hover
    }
`;

const StyledText = styled.p`
    text-decoration: none; // removes the underline
    color: white; // makes the text color white
    font-size: 40px;
    &:hover {
        cursor: pointer;
        color: #ddd; // changes color to a slightly darker white on hover
    }
`;

function SidePanel({imageUrl}) {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const [options, setOptions] = useState({
        'Settings': '/settings'
    });

    const togglePanel = () => {
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        const getCoachSlug = async () => {

            try {
                const url = `${process.env.REACT_APP_URL}/auth/coach/slug`;
                const response = await axios.get(url, {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                })

                const slug = response.data.slug;

                setOptions(prevOptions => ({
                    ...prevOptions,
                    'Timetable': `/${slug}`
                }));
            } catch (error){
                console.log(error);
            }

        }

        getCoachSlug();
    }, [])

    const handleSignOut = () => {

        localStorage.setItem('AccessToken', "");
        localStorage.setItem('RefreshToken', "");
        localStorage.setItem('email', "")

        navigate('/')

    }

    return (
        <div>
            <ProfileButton 
                onClick={togglePanel} 
                size={40}
                imageUrl={imageUrl}
            />
            <Overlay isVisible={isOpen} onClick={togglePanel} />
            <SidePanelContainer isOpen={isOpen}>
                {/* Side panel content goes here */}
                 {/* Looping through options object */}
                 <ul>
                    {Object.entries(options).map(([key, value], index) => (
                        <li key={index}>
                            <strong>
                                {/* Use the StyledLink component here */}
                                <StyledLink to={`${value}`}>
                                    {key}
                                </StyledLink>
                            </strong>
                        </li>
                    ))}
                    <li>
                        <strong>
                            <StyledText onClick={handleSignOut}>Sign Out</StyledText>
                        </strong>
                    </li>
                    
                </ul>
            </SidePanelContainer>
        </div>
    );
}

export default SidePanel;
