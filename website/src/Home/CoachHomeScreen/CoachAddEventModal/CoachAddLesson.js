import React, { useState } from "react";
import ChooseDateTimeComponent from "../../ChooseDateTimeComponent";

export default function CoachAddLesson () {

    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedStartTime, setSelectedStartTime] = useState(null);
    const [selectedDuration, setSelectedDuration] = useState(null);

    return (
        <div>
            <ChooseDateTimeComponent
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                setStartTime={setSelectedStartTime}                
                setDuration={setSelectedDuration}
            />
        </div>
    )

}