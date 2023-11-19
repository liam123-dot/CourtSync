import React, { useState } from "react";
import SideBar from "../Sidebar";
import InvoicingSettings from "./AdvancedSettings/InvoicingSettings";

const SUB_OPTIONS = [
    { label: 'Invoicing', component: InvoicingSettings},
    // { label: 'Notifications', component: () => <div>Notifications Settings</div> },
    // { label: 'Security', component: () => <div>Security Settings</div> },
];



export default function AdvancedSettingsWindow({}) {
    const [selectedOption, setSelectedOption] = useState(SUB_OPTIONS[0]);

    const SelectedContent = selectedOption ? selectedOption.component : () => <div>Select an option to display content.</div>;

    return (
        <div style={{
            height: '100vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            background: '#f7f7f7'
        
        }}>
            <SideBar setSelectedOption={setSelectedOption} selectedOption={selectedOption} OPTIONS={SUB_OPTIONS} />
            <div style={{
                flex: 4,
            }}>
                <SelectedContent />
            </div>
        </div>
    )
}