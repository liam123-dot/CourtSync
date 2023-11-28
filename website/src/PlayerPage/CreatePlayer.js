import React, {useState} from "react";
import axios from "axios";

export default function CreatePlayer ({contactId, setOpen, fetchData}) {

    const [playerName, setPlayerName] = useState("");

    const submitPlayer = async () => {

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact/${contactId}/player`, {
                name: playerName,
            }, {
                headers: {
                    Authorization: `${localStorage.getItem("AccessToken")}`,
                },
            })

            fetchData();
            setOpen(false);
            

        } catch (error) {
            console.log(error)
        }

    }

    return (
        <div>
            <form>
                <label>
                    Player Name:
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />
                </label>
                <input type="submit" value="Submit" onClick={submitPlayer}/>
            </form>
        </div>
    )

}
