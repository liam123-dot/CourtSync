import axios from "axios";
import React, { useEffect, useState } from "react";
import { refreshTokens } from "../Authentication/RefreshTokens";

import styled from '@emotion/styled';
import { useNavigate } from "react-router-dom";
import { Spinner } from "../Spinner";

export const Button = styled.button`
      width: 180px;
      height: 40px;
      padding: 10px;
      background-color: #007bff;
      color: #fff;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.3s;

  &:hover {
    background-color: #0056b3;
      }
    `;

const buttonStyles = {
  backgroundColor: 'white',
  color: '#004d99',
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1em',
  marginRight: '10px',
}

export default function EntryPage ({}) {

    const [isCoach, setIsCoach] = useState(false);
    const [coachSlug, setCoachSlug] = useState(null);

    const [checkLoading, setCheckLoading] = useState(false);

    console.log(`url: ${process.env.REACT_APP_API_URL}`)

    const navigate = useNavigate();

    useEffect(() => {

        const doCheck = async () => {

            try {

                setCheckLoading(true);

                if (localStorage.getItem('RefreshLoading') === 'true'){
                    await refreshTokens();
                }

                const response = await axios.get(`${process.env.REACT_APP_API_URL}/auth/coach/check`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                })

                console.log(response);

                if (response.data.coach) {
                    setIsCoach(true);
                    setCoachSlug(response.data.slug);
                }


            } catch (error){
                console.log(error);
            }

            setCheckLoading(false);

        }

        doCheck();

    }, [])

    return (
        <div style={{
          display: 'flex',
          height: '100vh',
          width: '100%',
          flexDirection: 'column',
          backgroundColor: '#f7f7f7', // Light grey background for the whole page
        }}>
      
          <div style={{
            flex: 0, // Changed from flex: 1 to flex: 0 for a fixed height
            display: 'flex',
            alignItems: 'center', // Vertically center the items in the navbar
            justifyContent: 'flex-end', // Align the button to the right
            padding: '10px 20px', // Add some padding around the edges
            backgroundColor: '#004d99', // Dark blue background for the navbar
            color: 'white', // White text color
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', // Slight shadow for depth
          }}>
      
            <div style={{
              flex: 6
            }}>
              {/* Logo or title could go here */}
            </div>
      
            <div style={{
              flex: 2,
              textAlign: 'right', // Align the button text to the right
            }}>
              {checkLoading ? (
                <Spinner /> // Show Spinner while loading
              ) : (
                isCoach ? (
                  <Button 
                    onClick={() => { navigate(`/dashboard/${coachSlug}`) }} 
                    style={{
                      backgroundColor: 'white',
                      color: '#004d99',
                      padding: '10px 20px',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '1em',
                    }}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Button 
                          onClick={() => { navigate('/coach/signin') }}
                          style={buttonStyles}
                      >
                          Sign In
                      </Button>

                      <Button 
                          onClick={() => { navigate('/contact-sales') }}
                          style={buttonStyles}
                      >
                          Contact Sales
                      </Button>
                  </div>                 
                )
              )}
            </div>
      
          </div>
          <div style={{
            flex: 1, // Adjusted to allow content to fill the space
            padding: '40px', // More padding for the content area
            display: 'flex', // Use flex to center content
            flexDirection: 'column', // Stack items vertically
            alignItems: 'center', // Center items horizontally
            justifyContent: 'center', // Center items vertically
          }}>
      
            <h1 style={{
              fontSize: '2.5em', // Larger text for the main title
              color: '#004d99', // Dark blue text to match the navbar
              margin: '0', // Remove default margin
            }}>
              CourtSync
            </h1>
            <h2 style={{
              fontSize: '1.5em', // Slightly smaller text for the subtitle
              color: '#333', // Dark grey for the subtitle
              fontWeight: 'normal', // Normal font weight for the subtitle
              textAlign: 'center', // Center-align the subtitle
              marginTop: '10px', // Space above the subtitle
            }}>
              Your end-to-end solution for all your coaching admin
            </h2>
            { !isCoach &&
              <h3 style={{
                fontSize: '1.5em', // Slightly smaller text for the subtitle
                color: '#333', // Dark grey for the subtitle
                fontWeight: 'normal', // Normal font weight for the subtitle
                textAlign: 'center', // Center-align the subtitle
                marginTop: '10px', // Space above the subtitle
              }}>
                Contact sales to get started!
              </h3>
            }
            
      
          </div>
      
        </div>
      )
      
      

}
