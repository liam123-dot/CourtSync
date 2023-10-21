import React, {useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUpScreen from "./Authentication/SignUpScreen";
import VerificationCodeScreen from "./Authentication/VerificationCodeScreen";
import HomeScreen from "./Home/HomeScreen";
import SignInScreen from "./Authentication/SignInScreen";
import { refreshTokens } from './Authentication/RefreshTokens';

function Main() {

    useEffect(() => {

        refreshTokens();

    }, [])

    return (
        <Router>
            <Routes>
                <Route path="/signin" element={<SignInScreen/>} />
                <Route path="/signup" element={<SignUpScreen/>} />
                <Route path="/verify" element={<VerificationCodeScreen/>} />
                <Route path="/home/:coachSlug" element={<HomeScreen/>} />
            </Routes>
        </Router>
    );
}

export default Main;
