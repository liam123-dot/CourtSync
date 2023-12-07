import React, { useEffect, useState } from "react";
import InvoicingSettings from "./AdvancedSettings/InvoicingSettings";
import DurationSelector from "./AdvancedSettings/DurationSelection";
import PricingSettings from "./AdvancedSettings/PricingSettings/PricingSettings";
import WorkingHoursSettings from "./AdvancedSettings/WorkingHours";
import SidebarHousing from "../SidebarHousing";

export default function AdvancedSettingsWindow({}) {

    const SUB_OPTIONS = [
        { label: 'Invoicing', component: InvoicingSettings},
        { label: 'Duration Selection', component: DurationSelector, endpointName: 'durations'},
        { label: 'Pricing', component: PricingSettings, endpointName: 'pricing_rules'},
        { label: 'Working Hours', component: WorkingHoursSettings, endpointName: 'working_hours'},
        // { label: 'Notifications', component: () => <div>Notifications Settings</div> },
    ];

    const [OPTIONS, setOPTIONS] = useState(SUB_OPTIONS);

    return (
        <SidebarHousing
            firstSelected={OPTIONS[0]}
            _titles={OPTIONS.map((option) => option.label)}
            _components={OPTIONS.map((option) => option.component)}
            _endpoints={OPTIONS.map((option) => option.endpointName)}
            />
    )
}