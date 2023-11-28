import React, {useState} from "react";
import axios from "axios";

export default function CreateContact ({setOpen, fetchData}) {

    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhoneNumber, setContactPhoneNumber] = useState("");

    const submitContact = async () => {

        try {

            const response = await axios.post(`${process.env.REACT_APP_API_URL}/contact`, {
                name: contactName,
                email: contactEmail,
                phone_number: contactPhoneNumber,
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
        <div style={{
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
                <input type="submit" value="Submit" onClick={submitContact}/>
            </form>
        </div>
    )

}
