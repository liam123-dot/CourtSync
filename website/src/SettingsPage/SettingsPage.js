import React, {useEffect, useState} from "react";
import CoachProfileSettings from "./Pages/CoachProfileSettings";
import AdvancedSettingsWindow from "./Pages/AdvancedSettingsWindow";

import SidebarHousing from "./SidebarHousing";


export default function SettingsPage({}) {
    const [OPTIONS, setOPTIONS] = useState([
        { label: 'Profile', component: CoachProfileSettings},
        { label: 'Settings', component: AdvancedSettingsWindow, endpointName: 'any'},
    ]);
    
    return (
        <SidebarHousing 
            firstSelected={OPTIONS[0]} 
            _titles={OPTIONS.map((option) => option.label)} 
            _components={OPTIONS.map((option) => option.component)} 
            _endpoints={OPTIONS.map((option) => option.endpointName)} 
        />
    );
}