import React, {useState} from "react";
import FeaturesPage from "./Pages/Features";
import CoachProfileSettings from "./Pages/CoachProfileSettings";

const OPTIONS = [
    { label: 'Profile', component: CoachProfileSettings},
    { label: 'Features', component: FeaturesPage },
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

function Option({ label, onClick, isSelected }) {
    return (
        <div onClick={onClick} style={{ padding: 10, backgroundColor: isSelected ? 'lightgray' : 'white', cursor: 'pointer' }}>
            {label}
        </div>
    );
}

function SideBar({ setSelectedOption, selectedOption }) {
    return (
        <div style={{
            flex: 1,
            border: '1px solid #000',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {OPTIONS.map(option => (
                <Option 
                    key={option.label} 
                    label={option.label} 
                    onClick={() => setSelectedOption(option)} 
                    isSelected={selectedOption === option} 
                />
            ))}
        </div>
    );
}

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
                <SideBar setSelectedOption={setSelectedOption} selectedOption={selectedOption} />
            </div>
            <div style={ContentStyle}>
                <SelectedContent />
            </div>
        </div>
    );
}