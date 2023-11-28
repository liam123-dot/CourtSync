import axios from "axios";

export const fetchTimetable = async (fromDate, toDate, coachSlug, forCoachScreen) => {

    // Create new Date objects based on the passed dates to avoid direct mutation
    const fromDateCopy = new Date(fromDate);
    const toDateCopy = new Date(toDate);

    fromDateCopy.setHours(0, 0, 0);
    toDateCopy.setHours(23, 59, 59);

    const epochFromDate = Math.floor(fromDateCopy.getTime() / 1000);
    const epochToDate = Math.floor(toDateCopy.getTime() / 1000);

    let headers = {}

    if (forCoachScreen){
        headers = {
            'Authorization': localStorage.getItem('AccessToken')
        }
    }
        
    try {
        const response = await axios.get(
            `${process.env.REACT_APP_API_URL}/timetable/${coachSlug}?from_time=${epochFromDate}&to_time=${epochToDate}`,
            {headers: headers}  
        );

        const data = response.data

        return {
            authorised: data.authorised,        
            bookings: data.bookings,
            coachEvents: data.coach_events,
            defaultWorkingHours: data.default_working_hours,
            durations: data.durations,
            exists: data.exists,
            pricingRules: data.pricing_rules,
            workingHours: data.working_hours,
            all: data.all,
            global_max: data.global_max,
            global_min: data.global_min,
            coach_setup: data.coach_set_up
        }

    } catch (error) {

        console.log(error);
        const errorResponse = error.response;
        console.log(errorResponse);

        if (errorResponse.data && errorResponse.data.message === 'Coach with passed slug does not exist') {

            return {exists: false}

        }

        const statusCode = errorResponse && errorResponse.statusCode;
        if (statusCode === 404) {
            console.log('not found');
        }

    }
}