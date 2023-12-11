import styled from "@emotion/styled";

export const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 2px solid #4A90E2;
`;

export const ArrowButtonGroup = styled.div`
  display: flex;
`;

export const Button = styled.button`
  margin: 0 5px;
  padding: 10px 15px;
  font-size: 1.2em;
  border: none;
  cursor: pointer;
  transition: color 0.3s;
  border-bottom: ${props => props.selected ? '3px solid #4A90E2' : 'none'};

  &:hover {
    color: #357ABD;
  }
`;

export const DateLabel = styled.span`
  margin: 0 10px;
  font-weight: bold;
  font-size: 1.2em;
`;

export const checkRefreshRequired = (loadedDates, fromDate, toDate) => {
    let currentDate = new Date(fromDate);

        while (currentDate <= toDate) {
            const formattedDate = `${currentDate.getDate().toString().padStart(2, '0')}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getFullYear()}`;
            
            if (!loadedDates.includes(formattedDate)) { 
                return true; // Refresh required
            }

            // Move to the next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

    return false; // No refresh required
} 

export const getStartEndOfWeek = currentDate => {
    const currentDayOfWeek = currentDate.getDay();  // 0 (Sunday) - 6 (Saturday)

    console.log(currentDayOfWeek)

    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    const sundayOffset = currentDayOfWeek === 0 ? 0 : 7 - currentDayOfWeek;

    const monday = new Date(currentDate);
    monday.setDate(monday.getDate() + mondayOffset);

    const sunday = new Date(currentDate);
    sunday.setDate(sunday.getDate() + sundayOffset);

    return {fromDate: monday, toDate: sunday};

}

export const handleSetView = async (view, setView, fromDate, toDate, setFromDate, setToDate, refresh) => {
    const currentDate = new Date();
    console.log(fromDate);

    if (view === 'week') {
        const startAndEnd = getStartEndOfWeek(fromDate);
        await refresh(startAndEnd.fromDate, startAndEnd.toDate);
        setFromDate(startAndEnd.fromDate);
        setToDate(startAndEnd.toDate);
    } else {
        if (currentDate >= fromDate && currentDate <= toDate) {
            setFromDate(currentDate);
            setToDate(currentDate);
        } else {
            setToDate(fromDate);
        }
    }
    setView(view);
}

export const handleNext = async (fromDate, toDate, setFromDate, setToDate, refresh, view) => {
    const newFromDate = new Date(fromDate);
    const newToDate = new Date(toDate);
    if (view === 'week') {
        newFromDate.setDate(fromDate.getDate() + 7);

        newToDate.setDate(toDate.getDate() + 7);

        await refresh(newFromDate, newToDate);

    } else if (view === 'day') {
        newFromDate.setDate(fromDate.getDate() + 1);

        newToDate.setDate(toDate.getDate() + 1);
        
        await refresh(newFromDate, newToDate);

    }
        
    setFromDate(newFromDate);
    setToDate(newToDate);
}
export const handlePrevious = async (fromDate, toDate, setFromDate, setToDate, refresh, view) => {
    const newFromDate = new Date(fromDate);
    const newToDate = new Date(toDate);
    if (view === 'week') {
        newFromDate.setDate(fromDate.getDate() - 7);

        newToDate.setDate(toDate.getDate() - 7);

        await refresh(newFromDate, newToDate);
    } else {
        newFromDate.setDate(fromDate.getDate() - 1);

        newToDate.setDate(toDate.getDate() - 1);

        await refresh(newFromDate, newToDate);
    }
    setFromDate(newFromDate);
    setToDate(newToDate);
}