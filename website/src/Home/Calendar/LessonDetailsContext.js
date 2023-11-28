import React, {createContext, useContext} from "react";

const LessonDetailsContext = createContext(null);

export const useLessonDetails = () => useContext(LessonDetailsContext);

export const LessonDetailsProvider = ({children, setBookings, setShown}) => {

    const value = {
        setBookings,
        setShown
    }

    return (
        <LessonDetailsContext.Provider value={value}>
            {children}
        </LessonDetailsContext.Provider>
    )

}
 