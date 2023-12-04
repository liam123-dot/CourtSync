import { useEffect, useState } from "react";
import axios from "axios";

function Option({ label, onClick, isSelected, errorMessage }) {
    return (
        <div onClick={onClick} style={{ padding: 10, backgroundColor: isSelected ? 'lightgray' : 'white', cursor: 'pointer' }}>
            <p>
                {label}
            </p>
            {
                errorMessage && <span style={{ color: 'red' }}>{errorMessage}</span>
            }
        </div>
    );
}

export default function SideBar({ setSelectedOption, selectedOption, _OPTIONS }) {

    const [data, setData] = useState([]); 
    const [OPTIONS, setOPTIONS] = useState(_OPTIONS);

    const getRequiresSetup = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/user/me/settings`, {
                headers: {
                    Authorization: localStorage.getItem("AccessToken"),
                },
            });
            setData(response.data);
            console.log(response.data);
            // You can now use the response object
        } catch (error) {
            // Handle the error
            console.error(error);
        }
    }

    useEffect(() => {
        console.log(_OPTIONS)
        
        getRequiresSetup();

    }, [])

    useEffect(() => {
        if (!OPTIONS) return;
        const requiresSetup = OPTIONS.filter(option => option.endpointName).some(option => data[option.endpointName] === false);

        if (requiresSetup) {
            const newOptions = OPTIONS.map(option => {
                if (option.endpointName && data[option.endpointName] === false) {
                    // only add the '- requires setup' if it's not already there
                    if (!option.errorMessage)
                        return { ...option, label: `${option.label}`, errorMessage: 'Requires setup' };
                }              
                return option;
            });

            // Update the OPTIONS state
            setOPTIONS(newOptions);
        }

    }, [data]);

    return (
        <div style={{
            flex: 1,
            border: '1px solid #000',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}>
            {OPTIONS && OPTIONS.map(option => (
                <Option 
                    key={option.label} 
                    label={option.label} 
                    onClick={() => setSelectedOption(option)} 
                    isSelected={selectedOption === option} 
                    errorMessage={option.errorMessage}
                />
            ))}
        </div>
    );
}