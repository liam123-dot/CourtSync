export class TimetableEvent {

    constructor(id, startTime, duration, date, startTimeWithoutGlobal, durationWithoutGlobal){
        this.id = id;
        this.startTime = startTime;
        this.duration = duration;
        this.date = date;
        this.minutesIntoDay = this.getMinutesIntoDay(date, startTime);
        this.endTime = this.minutesIntoDay + duration;
        this.startTimeWithoutGlobal = startTimeWithoutGlobal;
        this.durationWithoutGlobal = durationWithoutGlobal;
    }

    getMinutesIntoDay = (date, timeEpoch) => {
        // given a date in dd-mm-yyyy and epoch time in seconds, find the number of minutes into the day
        const dateParts = date.split('-');
        const day = dateParts[0];
        const month = dateParts[1];
        const year = dateParts[2];
        const dateObj = new Date(`${month}-${day}-${year}`);
        const time = new Date(timeEpoch * 1000);
        const minutes = (time.getHours() * 60) + time.getMinutes();
        return minutes;

    }

}