function getDatesBetween(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = [];
    
    for (let dt = start; dt <= end; dt.setDate(dt.getDate() + 1)) {
        dates.push(new Date(dt));
    }
    
    return dates;
}

const getOrdinalSuffix = (day) => {
    if (day % 10 === 1 && day !== 11) return "st";
    if (day % 10 === 2 && day !== 12) return "nd";
    if (day % 10 === 3 && day !== 13) return "rd";
    return "th";
}

const formatCustomDate = (date) => {
    const options = { weekday: 'long' };
    const weekday = new Intl.DateTimeFormat('en-US', options).format(date);
    const dayOfMonth = date.getDate();
    return `${weekday} ${dayOfMonth}${getOrdinalSuffix(dayOfMonth)}`;
}
export default function GetDaysBetweenDates (fromDate, toDate) {

    const dates = getDatesBetween(fromDate, toDate);
    const days = dates.map(date => formatCustomDate(date));

    return days;

}