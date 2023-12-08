import axios from "axios";

export const checkValid = async (newStartDate, newEndDate, newStartTime, newEndTime, repeats, repeats_until, repeats_frequency) => {

    try {
        console.log(newStartDate, newEndDate, newStartTime, newEndTime);
        // convert the start and end times to epoch time seconds
        const fromTime = new Date(`${newStartDate}T${newStartTime}`);
        const toTime = new Date(`${newEndDate}T${newEndTime}`);

        const fromTimeEpoch = Math.floor(fromTime.getTime() / 1000);
        const toTimeEpoch = Math.floor(toTime.getTime() / 1000);
        
        let response;

        if (repeats && repeats_frequency && repeats_until) {

            response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${fromTimeEpoch}&&to=${toTimeEpoch}&repeats=${repeats}&repeat_frequency=${repeats_frequency}&repeat_until=${calculateRepeatsUntil(newStartDate, newStartTime, repeats_until)}`,
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );

        } else {
            
            response = await axios.get(`${process.env.REACT_APP_API_URL}/timetable/check-overlaps?from=${fromTimeEpoch}&&to=${toTimeEpoch}`,
                {
                    headers: {
                        'Authorization': localStorage.getItem('AccessToken')
                    }
                }
            );
        }
        
        const data = response.data;

        if (data.overlaps){
            return {
                overlaps: true,
                bookings: data.bookings,
                events: data.events
            }            
        } else {
            return {
                overlaps: false,
                bookings: [],
                events: []
            }
        }

    } catch (error) {
        console.log(error);
        return;
    }
    
}
const calculateRepeatsUntil = (startDate, startTime, repeatUntil) => {

    // using the start date, add the number of weeks to it specified by repeatUntil
    // then convert that to a epoch time in seconds

    const startDateObj = new Date(`${startDate}T${startTime}`);
    const startDateEpoch = Math.floor(startDateObj.getTime() / 1000);

    const repeatUntilEpoch = startDateEpoch + (repeatUntil * 7 * 24 * 60 * 60);

    return repeatUntilEpoch;

}