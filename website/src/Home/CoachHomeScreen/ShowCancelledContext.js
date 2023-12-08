import React, { createContext, useState, useContext } from 'react';

const ShowCancelledContext = createContext();

export const useShowCancelled = () => useContext(ShowCancelledContext);

export const ShowCancelledProvider = ({ children, showCancelled, setShowCancelled }) => {
    
    return (
        <ShowCancelledContext.Provider value={{ showCancelled, setShowCancelled }}>
        {children}
        </ShowCancelledContext.Provider>
    );
    }
