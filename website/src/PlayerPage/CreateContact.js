import React, { useState } from "react";
import axios from "axios";
import { usePopup } from "../Notifications/PopupContext";

export default function CreateContact({ setOpen, fetchData }) {
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhoneNumber, setContactPhoneNumber] = useState("");
    const [isPlayerICoach, setIsPlayerICoach] = useState(false); // Added state for checkbox

    const { showPopup } = usePopup();

    const submitContact = async () => {
        try {
            const response = await axios.post(
                `${process.env.REACT_APP_API_URL}/contact`,
                {
                    name: contactName,
                    email: contactEmail,
                    phone_number: contactPhoneNumber,
                    is_player: isPlayerICoach, // Added is_player_i_coach field
                },
                {
                    headers: {
                        Authorization: `${localStorage.getItem("AccessToken")}`,
                    },
                }
            );

            fetchData();
            setOpen(false);
            showPopup("Contact created successfully");
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
                borderRadius: "1px",
                border: "1px solid black",
                padding: "1%",
            }}
        >
            <form>
                <div>
                    <label>
                        Contact Name:
                        <input
                            type="text"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Contact Email:
                        <input
                            type="text"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Contact Phone Number:
                        <input
                            type="text"
                            value={contactPhoneNumber}
                            onChange={(e) => setContactPhoneNumber(e.target.value)}
                        />
                    </label>
                </div>
                <div>
                    <label>
                        Is also a player I coach:
                        <input
                            type="checkbox"
                            checked={isPlayerICoach}
                            onChange={(e) => setIsPlayerICoach(e.target.checked)}
                        />
                    </label>
                </div>
                <input type="submit" value="Submit" onClick={submitContact} />
            </form>
            <button onClick={() => setOpen(false)}>Cancel</button>
        </div>
    );
}