import { useEffect } from "react"

export default function ShowOverlappingEvents({overlappingEvents}) {

    useEffect(() => {

        console.log(overlappingEvents);

    }, [overlappingEvents])

    return (
        <div>
            {overlappingEvents && (
                <>
                {
                    overlappingEvents.bookings.length > 0 && (
                        <>
                            <h2>Overlapping Bookings</h2>
                            <ul>
                                {overlappingEvents.bookings.map(booking => (
                                    <li key={booking.id}>
                                        {booking.player_name}
                                        <br />
                                        {new Date(booking.start_time * 1000).toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )
                    
                }
                {
                    overlappingEvents.events.length > 0 && (
                        <>
                            <h2>Overlapping Events</h2>
                            <ul>
                                {overlappingEvents.events.map(event => (
                                    <li key={event.id}>
                                        {event.title}                                      
                                        <br />
                                        {new Date(event.start_time * 1000).toLocaleString()}
                                    </li>
                                ))}
                            </ul>
                        </>
                    )
                }
                </>                    
            )}
        </div>
    )
    
}
