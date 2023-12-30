export const convertTimeToEpoch = (date, time) => {

    // date is datejs object and time is epoch seconds

    const dateEpoch = date.valueOf() / 1000;

    return dateEpoch + time;

}

export const convertTimeStringToEpoch = (time) => {

    // split time into hours and minutes
    const timeArray = time.split(':');

    // convert hours and minutes to epoch seconds by taking hours * 3600 and minutes * 60
    const hours = parseInt(timeArray[0]) * 3600;
    const minutes = parseInt(timeArray[1]) * 60;

    // add hours and minutes together to get epoch seconds
    const timeEpoch = hours + minutes;

    return timeEpoch;

}

export const calculateStartAndEndTime = (date, startTime, endTime) => {          
    
    if (!date || !startTime || !endTime) return

    const epochStartTime = convertTimeToEpoch(date, convertTimeStringToEpoch(startTime));
    const epochEndTime = convertTimeToEpoch(date, convertTimeStringToEpoch(endTime));

    return {
        startTime: epochStartTime,
        endTime: epochEndTime
    }

}