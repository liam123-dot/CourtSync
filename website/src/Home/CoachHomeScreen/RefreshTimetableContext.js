import React, {createContext, useContext} from "react";

const RefreshTimetableContext = createContext(null);

export const useRefreshTimetable = () => useContext(RefreshTimetableContext);

export const RefreshTimetableProvider = ({children, refresh}) => {

    const value = {
        refresh
    }

    return (
        <RefreshTimetableContext.Provider value={value}>
            {children}
        </RefreshTimetableContext.Provider>
    )

}
