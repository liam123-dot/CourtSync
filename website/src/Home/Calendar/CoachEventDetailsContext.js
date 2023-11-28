import {createContext, useContext} from "react";

const CoachEventDetailsContext = createContext(null);

export const useCoachEventDetails = () => useContext(CoachEventDetailsContext);

export const CoachEventDetailsProvider = ({children, setCoachEvent, setShown}) => {

    const value = {
        setCoachEvent,
        setShown
    }

    return (
        <CoachEventDetailsContext.Provider value={value}>
            {children}
        </CoachEventDetailsContext.Provider>
    )

}
