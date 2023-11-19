import React, {useEffect} from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import SignUpScreen from "./Authentication/SignUpScreen";
import VerificationCodeScreen from "./Authentication/VerificationCodeScreen";
// import PlayerHomeScreen from "./Home/PlayerHomeScreen/PlayerHomeScreen"
import CoachHomeScreen from "./Home/CoachHomeScreen/CoachHomeScreen"
import SignInScreen from "./Authentication/SignInScreen";
import { refreshTokens } from './Authentication/RefreshTokens';
import SettingsPage from './SettingsPage/SettingsPage';
import EntryPage from './EntryPage/EntryPage';
import CancelBookingPage from './PlayerBookings/CancelBookingsPage';
import InvoicePage from './PlayerBookings/InvoicePage';
import PlayerPage from './PlayerPage/PlayerPage';
import PlayerHomeScreen from './Home/PlayerHomeScreen/PlayerHomeScreen';

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
                <Route path="/:coachSlug" element={<PlayerHomeScreen/>} />
                <Route path="/dashboard/:coachSlug" element={<CoachHomeScreen/>} />
                <Route path="/dashboard/invoices" element={<InvoicePage />} />
                <Route path="/dashboard/players" element={<PlayerPage/>}/>

                <Route path="/bookings/:bookingHash/cancel" element={<CancelBookingPage/>} />

            </Routes>
        </Router>
    );
}

export default Main;
