import React from 'react';
import './App.css'
import Main from "./Main";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'

function App() {

    return (
        <div className="App">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <Main/>
            </LocalizationProvider>
        </div>
    );
}

export default App;
