import React, {useState} from "react";
import axios from "axios";

export default function CreatePlayer ({contactId, setOpen, fetchData}) {

    const [playerName, setPlayerName] = useState("");

    const submitPlayer = async (e) => {
        e.preventDefault();
    
        const nameParts = playerName.split(' ');
        if (nameParts.length < 2) {
            alert("Please enter a first name and a surname.");
            return;
        }
    
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

    const handleNameChange = (e) => {
        const value = e.target.value;
        setPlayerName(value.replace(/\b\w/g, char => char.toUpperCase()));
    }

    return (
        <div>
            <form onSubmit={submitPlayer}>
                <label>
                    Player Name:
                    <input
                        type="text"
                        value={playerName}
                        onChange={handleNameChange}
                    />
                </label>
                <input type="submit" value="Submit" />
            </form>
            <button onClick={() => setOpen(false)}>Cancel</button>
        </div>
    )
}