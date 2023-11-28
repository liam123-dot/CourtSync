import React, {useEffect} from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
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
import NavigationBar from './NavigationBar';

function Main() {

    useEffect(() => {

        refreshTokens();

        const intervalId = setInterval(refreshTokens, 60 * 60 * 1000);

        return () => clearInterval(intervalId);

    }, [])

    return (
        <div style={{
            width: "100%",
            height: "100vh",
        }}>
            <Router>
                <Routes>
                    <Route path="/" element={<EntryPage/>} />
                    <Route path="/coach/signin" element={<SignInScreen/>} />
                    <Route path="/coach/signup" element={<SignUpScreen/>} />
                    <Route path="/coach/verify" element={<VerificationCodeScreen/>} />                
                    <Route path="/:coachSlug" element={<PlayerHomeScreen/>} />

                    <Route path="/dashboard/*" element={<CoachDashboard/>} />

                    <Route path="/bookings/:bookingHash/cancel" element={<CancelBookingPage/>} />

                </Routes>
            </Router>
        </div>
    );
}

function CoachDashboard() {
    return (    
        <div style={{
            width: "100%",
            height: "100vh",
        }}>
            <NavigationBar/>
            <Routes>
                <Route path="/:coachSlug" element={<CoachHomeScreen/>} />
                <Route path="/settings" element={<SettingsPage/>} />
                <Route path="/invoices" element={<InvoicePage/>} />
                <Route path="/players" element={<PlayerPage/>} />
            </Routes>
        </div>
    )
}

export default Main;
