import React, {useEffect, useState} from "react";
import FeaturesPage from "./Pages/Features";
import CoachProfileSettings from "./Pages/CoachProfileSettings";
import AdvancedSettingsWindow from "./Pages/AdvancedSettingsWindow";
import SideBar from "./Sidebar";

const OPTIONS = [
    { label: 'Profile', component: CoachProfileSettings},
    { label: 'Settings', component: AdvancedSettingsWindow, endpointName: 'any'}
];

const SidebarStyle = {
    flex: 1,
    borderRight: '3px solid #aaa',
    height: '100%',
    padding: '20px',
    background: 'linear-gradient(45deg, #f3f3f3, #e7e7e7)'
};

const ContentStyle = {
    flex: 4,
    paddingLeft: '30px',
    height: '100%',
    padding: '20px'
};



export default function SettingsPage({}) {
    const [selectedOption, setSelectedOption] = useState(null);

    const SelectedContent = selectedOption ? selectedOption.component : () => <div>Select an option to display content.</div>;

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            flexDirection: 'row',
            background: '#f7f7f7'
        }}>
            <div style={SidebarStyle}>                
                <SideBar setSelectedOption={setSelectedOption} selectedOption={selectedOption} _OPTIONS={OPTIONS}/>
            </div>
            <div style={ContentStyle}>
                <SelectedContent />
            </div>
        </div>
    );
}