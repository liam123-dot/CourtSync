import axios from "axios";

export const fetchInvoiceData = async (week, month, year, contactEmail, statusView) => {

    try {
        let url;
        if (week) {
            url = `${process.env.REACT_APP_API_URL}/invoices/daily?week=${week}&year=${year}&contactEmail=${contactEmail}&statusView=${statusView}`;
        } else {
            url = `${process.env.REACT_APP_API_URL}/invoices/daily?month=${month}&year=${year}&contactEmail=${contactEmail}&statusView=${statusView}`;
        }
        const response = await axios.get(url, {
            headers: {
                Authorization: localStorage.getItem('AccessToken')
            }
        });
        return response.data

    } catch (error) {
        console.log(error)
    }    

}
