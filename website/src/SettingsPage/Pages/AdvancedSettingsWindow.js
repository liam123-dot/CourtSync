import React, { useEffect, useState } from "react";
import SideBar from "../Sidebar";
import axios from "axios";
import InvoicingSettings from "./AdvancedSettings/InvoicingSettings";
import DurationSelector from "./AdvancedSettings/DurationSelection";
import PricingSettings from "./AdvancedSettings/PricingSettings";
import WorkingHoursSettings from "./AdvancedSettings/WorkingHours";

export default function AdvancedSettingsWindow({}) {

    const SUB_OPTIONS = [
        { label: 'Invoicing', component: InvoicingSettings},
        { label: 'Duration Selection', component: DurationSelector, endpointName: 'durations'},
        { label: 'Pricing', component: PricingSettings, endpointName: 'pricing_rules'},
        { label: 'Working Hours', component: WorkingHoursSettings, endpointName: 'working_hours'},
        // { label: 'Notifications', component: () => <div>Notifications Settings</div> },
    ];

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
            <SideBar setSelectedOption={setSelectedOption} selectedOption={selectedOption} _OPTIONS={SUB_OPTIONS} />
            <div style={{
                flex: 4,
            }}>
                <SelectedContent />
            </div>
        </div>
    )
}