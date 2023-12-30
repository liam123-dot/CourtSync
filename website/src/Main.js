import React, {useEffect} from 'react';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import SignUpScreen from "./Authentication/SignUpScreen";
import VerificationCodeScreen from "./Authentication/VerificationCodeScreen";
import CoachHomeScreen2 from './Home/CoachHomeScreen/CoachHomeScreen2';
import SignInScreen from "./Authentication/SignInScreen";
import { refreshTokens } from './Authentication/RefreshTokens';
import SettingsPage2 from './SettingsPage/SettingsPage2';
import EntryPage from './EntryPage/EntryPage';
import CancelBookingPage from './PlayerBookings/CancelBookingsPage';
import InvoicePage from './Home/InvoicePage/InvoicePage';
import PlayerPage from './PlayerPage/PlayerPage';
import PlayerHomeScreen2 from './Home/PlayerHomeScreen2/PlayerHomeScreen2';
import NavigationBar from './NavigationBar';
import SuccessPopup from './Notifications/SuccessPopup';
import { PopupProvider } from './Notifications/PopupContext';
import ContactSales from './EntryPage/ContactSales';
import ConfirmBooking from './Home/PlayerHomeScreen2/ConfirmBooking';

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
            <PopupProvider>
                <Router>
                    <Routes>
                        <Route path="/" element={<EntryPage/>} />
                        <Route path="/coach/signin" element={<SignInScreen/>} />
                        <Route path="/coach/signup/:hash" element={<SignUpScreen/>} />
                        <Route path="/coach/verify" element={<VerificationCodeScreen/>} />                
                        <Route path="/:coachSlug" element={<PlayerHomeScreen2/>} />
                        <Route path="/:coachSlug/confirm" element={<ConfirmBooking/>} />

                        <Route path="/contact-sales" element={<ContactSales/>} />

                        <Route path="/dashboard/*" element={<CoachDashboard/>} />

                        <Route path="/bookings/:bookingHash/cancel" element={<CancelBookingPage/>} />

                    </Routes>
                </Router>

                <SuccessPopup />

            </PopupProvider>

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
                <Route path="/:coachSlug" element={<CoachHomeScreen2/>} />
                <Route path="/settings" element={<SettingsPage2/>} />
                <Route path="/invoices" element={<InvoicePage/>} />
                <Route path="/contacts" element={<PlayerPage/>} />
            </Routes>
        </div>
    )
}

export default Main;
