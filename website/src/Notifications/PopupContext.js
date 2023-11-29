import React, { createContext, useState, useContext } from 'react';

const PopupContext = createContext();

export const usePopup = () => useContext(PopupContext);

export const PopupProvider = ({ children }) => {
  const [popup, setPopup] = useState({ message: '', show: false });

  const showPopup = (message) => {
    setPopup({ message, show: true });

    setTimeout(() => {
      setPopup({ message: '', show: false });
    }, 2000); // Duration for the popup to show
  };

  return (
    <PopupContext.Provider value={{ popup, showPopup }}>
      {children}
    </PopupContext.Provider>
  );
};
