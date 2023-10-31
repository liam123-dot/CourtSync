import React, {useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUpScreen from "./Authentication/SignUpScreen";
import VerificationCodeScreen from "./Authentication/VerificationCodeScreen";
import HomeScreen from "./Home/HomeScreen";
import SignInScreen from "./Authentication/SignInScreen";
import { refreshTokens } from './Authentication/RefreshTokens';
import SettingsPage from './SettingsPage/SettingsPage';
import HistoryPage from './Home/History/HistoryPage';
import EntryPage from './EntryPage/EntryPage';

function Main() {

    useEffect(() => {

        refreshTokens();

    }, [])

    return (
        <Router>
            <Routes>
                <Route path="/" element={<EntryPage/>} />
                <Route path="/coach/signin" element={<SignInScreen/>} />
                <Route path="/coach/signup" element={<SignUpScreen/>} />
                <Route path="/coach/verify" element={<VerificationCodeScreen/>} />                
                <Route path="/settings" element={<SettingsPage/>} />
                <Route path="/:coachSlug" element={<HomeScreen/>} />
                <Route path="/:coachSlug/history" element={<HistoryPage/>}/>
            </Routes>
        </Router>
    );
}

export default Main;
