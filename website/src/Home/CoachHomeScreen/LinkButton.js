import { useState, useEffect } from "react";
import axios from "axios";
import { FiLink } from "react-icons/fi";
import { usePopup } from "../../Notifications/PopupContext";
import { Button } from "../HomescreenHelpers";

export default function LinkButton() {
  const [link, setLink] = useState("");
  const {showPopup} = usePopup();

  useEffect(() => {
    const getLink = async () => {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/user/me/coach_url`,
        {
          headers: {
            Authorization: localStorage.getItem("AccessToken"),
          },
        }
      );
      setLink(response.data.coach_url);
    };

    getLink();
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(link);
    showPopup("Link copied to clipboard");
  };

  return (
    <Button onClick={handleCopy}>
        
        <FiLink />
        
    </Button>
  );
}