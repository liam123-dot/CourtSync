
const getMinutesIntoDay = (epochSeconds) => {
    // given a date in dd-mm-yyyy and epoch time in seconds, find the number of minutes into the day
    const time = new Date(epochSeconds * 1000);
    const minutes = (time.getHours() * 60) + time.getMinutes();
    return minutes;
}

export function checkIfOverlaps({suggestedStartTime, suggestedDuration, all}){

    // get the date that the epoch seconds suggested start time corresponds to in dd-mm-yyyy
    const suggestedDate = new Date(suggestedStartTime * 1000).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).replace(/\//g, '-');
    // get how many minutes into that day the suggested start time is
    const suggestedStartTimeMinutes = getMinutesIntoDay(suggestedStartTime);

    // all is a dict of dd-mm-yyyy to list of timetable event objects. each of which have a minutesIntoDay and duration
    // check for any overlaps, if one exists return true, else return false

    // get the list of timetable event objects for the suggested date

    const timetableEventObjects = all[suggestedDate];

    // if there are no timetable event objects for the suggested date, then there are no overlaps
    if (!timetableEventObjects){
        return false;
    }

    // loop through the timetable event objects and check for overlaps
    for (let i = 0; i < timetableEventObjects.length; i++){

        const timetableEventObject = timetableEventObjects[i];

        // get the minutes into the day that the timetable event object starts
        const timetableEventObjectStartTimeMinutes = timetableEventObject.minutesIntoDay;

        // get the duration of the timetable event object
        const timetableEventObjectDuration = timetableEventObject.duration;

        // get the end time of the timetable event object
        const timetableEventObjectEndTimeMinutes = timetableEventObjectStartTimeMinutes + timetableEventObjectDuration;

        // check if the suggested start time is between the start and end time of the timetable event object
        if (suggestedStartTimeMinutes >= timetableEventObjectStartTimeMinutes && suggestedStartTimeMinutes < timetableEventObjectEndTimeMinutes){
            return true;
        }

        // check if the end time of the suggested event is between the start and end time of the timetable event object
        if (suggestedStartTimeMinutes + suggestedDuration > timetableEventObjectStartTimeMinutes && suggestedStartTimeMinutes + suggestedDuration <= timetableEventObjectEndTimeMinutes){
            return true;
        }

        // check if the suggested event overlaps the timetable event object
        if (suggestedStartTimeMinutes < timetableEventObjectStartTimeMinutes && suggestedStartTimeMinutes + suggestedDuration > timetableEventObjectEndTimeMinutes){
            return true;
        }

    }

    return false;

}

