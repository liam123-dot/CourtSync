import React from 'react';
import { usePopup } from './PopupContext'; // Import the context

const SuccessPopup = () => {
  const { popup } = usePopup();

  if (!popup.show) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: 'green',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
    }}>
      {popup.message}
    </div>
  );
};

export default SuccessPopup;
