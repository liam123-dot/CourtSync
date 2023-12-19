import React, { useState, createContext, useContext, useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import CoachProfileSettings from "./Pages/CoachProfileSettings";
import CoachPersonalSettings from "./Pages/CoachPersonalSettings";
import InvoicingSettings from "./Pages/AdvancedSettings/InvoicingSettings";
import DurationSelector from "./Pages/AdvancedSettings/DurationSelection";
import PricingSettings from "./Pages/AdvancedSettings/PricingSettings/PricingSettings";
import WorkingHoursSettingsHosting from "./Pages/AdvancedSettings/WorkingHoursSettingsHosting";

import axios from "axios";

const SettingsLabelsContext = createContext();

export const useSettingsLabels = () => useContext(SettingsLabelsContext);

export default function SettingsPage2() {
    const [selectedTab, setSelectedTab] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
      
    const [tabsToComponents, setTabsToComponents] = useState([
      { label: "Profile", component: <CoachProfileSettings />, url: "profile" },
      { label: "Personal Details", component: <CoachPersonalSettings />, url: "personalDetails" },
      { label: "Invoicing", component: <InvoicingSettings />, url: "invoicing" },
      { label: "Duration", component: <DurationSelector />, endpointName: "durations", url: 'durations' },
      { label: "Pricing", component: <PricingSettings />, endpointName: "pricing_rules", url: 'pricing' },
      { label: "Working Hours", component: <WorkingHoursSettingsHosting />, endpointName: "working_hours", url: 'workingHours'},
    ]);
  
    const handleTabChange = (event, newValue) => {
        setSelectedTab(newValue);
        navigate(`${location.pathname}?tab=${tabsToComponents[newValue].url}`);
    };
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabUrl = params.get('tab');
    
        if (tabUrl) {
            const tabIndex = tabsToComponents.findIndex(tab => tab.url === tabUrl);
            if (tabIndex !== -1) {
                setSelectedTab(tabIndex);
            }
        }
    }, [location, tabsToComponents]);

    const refreshLabels = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            const data = response.data;
        
            // Create a copy of tabsToComponents
            const updatedTabs = [...tabsToComponents];
        
            // iterate through the endpoints, check if that variable exists in the response
            for (const tab of updatedTabs) {
                if (data[tab.endpointName] === false && !tab.label.includes('Requires Setup')) {
                    tab.label = `${tab.label} - Requires Setup`;
                } else if (data[tab.endpointName] === true) {                    
                    tab.label = tab.label.replace(' - Requires Setup', '');
                }
            }
        
            // Update the state with the modified copy
            setTabsToComponents(updatedTabs);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        refreshLabels();
    }, []);

    return (
        <div style={{ display: "flex" }}>
            <Tabs
                orientation="vertical"
                variant="scrollable"
                value={selectedTab}
                onChange={handleTabChange}
                sx={{
                    marginRight: '10px',
                    borderRight: '1px solid #ddd', // Add border here
                    height: '100vh'
                }}
            >
                {tabsToComponents.map((tab, index) => (
                    <Tab 
                        key={index} 
                        label={tab.label} 
                        sx={{
                            width: '325px',
                            color: tab.label.includes('Requires Setup') ? 'red' : 'inherit',
                            fontWeight: tab.label.includes('Requires Setup') ? 'bold' : 'normal'
                        }}
                    />
                ))}
            </Tabs>
            <SettingsLabelsContext.Provider value={{refreshLabels}}>
                <div style={{ flex: 1 }}>{tabsToComponents[selectedTab].component}</div>
            </SettingsLabelsContext.Provider>
        </div>
    );
}