import axios from "axios";

export async function refreshTokens() {

    const refreshToken = localStorage.getItem('RefreshToken');
    const email = localStorage.getItem('email');

    if (refreshToken && email){

        const refreshUrl = `${process.env.REACT_APP_URL}/auth/coach/refresh`
        const data = {
            refreshToken: refreshToken,
            email: email
        };

        try {

            const response = await axios.post(refreshUrl, data);
        
            const authenticationResult = response.data.AuthenticationResult;
            const AccessToken = authenticationResult.AccessToken;
            const IdToken = authenticationResult.IdToken;

            localStorage.setItem('AccessToken', AccessToken);
            localStorage.setItem('IdToken', IdToken);

        } catch (error){
            console.log(error);
        }

    }

}
