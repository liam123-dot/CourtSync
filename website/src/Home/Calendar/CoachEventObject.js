import {TimetableEvent} from './TimetableEvent';

export class CoachEventObject extends TimetableEvent {

    constructor(id, startTime, duration){
        super(id, startTime, duration);
    }

    // Additional methods and properties specific to CoachEventObject can be added here
}