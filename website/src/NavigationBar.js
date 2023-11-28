import React, { useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Link } from "react-router-dom";
import axios from "axios";
import ProfileButton from "./SidePanel/ProfilePicture";

const StyledLink = styled(Link)`
    text-decoration: none;
    color: white;
    font-size: 30px;
    &:hover {
        color: #ddd;
    }
`;

export default function NavigationBar() {

    const [timetableLink, setTimetableLink] = useState(null);
    const [imageUrl, setImageUrl] = useState(null);

    useEffect(() => {

        const getSlug = async () => {

            try {
                
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/slug`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                })
                if (response.data.slug) {
                    setTimetableLink(`/${response.data.slug}`)
                }

            } catch (error) {
                console.log(error)
            }

        }

        const getImageUrl = async () => {
            
            try {

                const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/profile_picture_url`, {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                })
            
                setImageUrl(response.data.profile_picture_url)
                

            } catch (error) {
                console.log(error)
            }

        }

        getSlug();
        getImageUrl();

    }, [])

    return (
        <div style={{
            width: "100%",            
            flex: 1,
            backgroundColor: "#004d99",
            color: "white",
            display: "flex",
            flexDirection: "row",
        }}>
            <NavigationElement link={timetableLink} title="Timetable"/>
            <NavigationElement link="/invoices" title="Invoices"/>
            <NavigationElement link="/players" title="Players"/>
            <StyledLink 
                to={"/dashboard/settings"}
            >
                <ProfileButton imageUrl={imageUrl} size={30}/>
            </StyledLink>
        </div>
    )

}

const NavigationElement = ({link, title}) => {

    return (
        <div style={{
            width: "100%",
            flex: 1,
            backgroundColor: "#004d99",
            color: "white",
        }}>
            <StyledLink to={`/dashboard${link}`}>{title}</StyledLink>
        </div>
    )

}
