import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
/** @jsxImportSource @emotion/react */
import styled from '@emotion/styled';
import {css, Global} from "@emotion/react";
import { FaRegClock } from 'react-icons/fa';
import axios from "axios";
import CoachHomeScreen from "./CoachHomeScreen/CoachHomeScreen";
import PlayerHomeScreen from "./PlayerHomeScreen/PlayerHomeScreen";

export default function HomeScreen() {

    const [authorised, setAuthorised] = useState(false);
    const [loading, setIsLoading] = useState(false);
    const { coachSlug } = useParams();

    useEffect(() => {

        const checkAutorisation = async () => {

            try {                

                const headers = {
                    'Authorization': localStorage.getItem('AccessToken')
                }

                const response = await axios.get(
                    `${process.env.REACT_APP_URL}/timetable/${coachSlug}/check-authorisation`,
                    {headers: headers}
                    );

                const data = response.data;

                setAuthorised(data.authorised);


            } catch (error) {
                
                console.log(error)
                const errorResponse = error.response;
                const statusCode = errorResponse.statusCode;
                if (statusCode === 404) {

                    // Show invalid url error
                    console.log('not found')

                }

            }

        }

        checkAutorisation()

    }, [])

    return (
        <div style={{ 
            height: '100%', 
            width: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            padding: 10
        }}>
            <Global
                styles={css`
                body {
                    overflow: hidden;
                }
            `}
            />
            {
                loading ? <></>
                :
                (authorised ? 
                <>
                    <CoachHomeScreen/>
                </>:
                <>
                    <PlayerHomeScreen/>
                </>
                )
            }

        </div>
    );
}
