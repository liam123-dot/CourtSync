import React from 'react';
import './App.css';
import Main from "./Main";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { QueryClient, QueryClientProvider } from 'react-query';

function App() {
    const queryClient = new QueryClient();

    return (
        <div className="App">
            <LocalizationProvider dateAdapter={AdapterDayjs}>
                <QueryClientProvider client={queryClient}>
                    <Main />
                </QueryClientProvider>
            </LocalizationProvider>
        </div>
    );
}

export default App;
