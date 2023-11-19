import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "../../../Authentication/styles";
import { Spinner } from "../../../Authentication/styles";

export default function InvoicingSettings({}) {

    const [hasStripeAccount, setHasStripeAccount] = useState(false);
    const [isStripeSetupLoading, setIsStripeSetupLoading] = useState(false);
    const [isSaveLoading, setIsSaveLoading] = useState(false);

    const [invoiceType, setInvoiceType] = useState(null);

    useEffect(() => {

        const fetchData = async () => {

            const resposne = await axios.get(`${process.env.REACT_APP_URL}/user/me`, {
                headers: {
                    'Authorization': localStorage.getItem("AccessToken")
                }
            });

            const data = resposne.data;

            if (data.stripe_account){
                setHasStripeAccount(true);
            }

            setInvoiceType(data.invoice_type)

        }

        fetchData();
        
    }, []);

    const saveButton = async () => {

        try{

            setIsSaveLoading(true);

            const response = await axios.put(`${process.env.REACT_APP_URL}/user`, {
                invoice_type: invoiceType
            }, {
                headers: {
                    'Authorization': localStorage.getItem("AccessToken")
                }
            });
            
            console.log(response);

        } catch (error) {
            console.log(error);
        }
        setIsSaveLoading(false);

    }

    const generateOnboardingLink = async () => {
        setIsStripeSetupLoading(true);
        const response = await axios.post(`${process.env.REACT_APP_URL}/user/stripe-account`, {}, {
            headers: {
                'Authorization': localStorage.getItem("AccessToken")
            }
        });
        setIsStripeSetupLoading(false);
    
        const url = response.data.url;
        window.location.href = url;
    }

    return (
        <div>
            <h1>Invoicing Settings</h1>
            <p>Here you can configure your invoicing settings.</p>

            <p>Send invoices: 
            <select value={invoiceType} onChange={(e) => setInvoiceType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
            </select>
            </p>
            <Button type="submit" onClick={saveButton}>
                {isSaveLoading ? <Spinner /> : "Save"}
            </Button>
            {hasStripeAccount ? (
            <div>
                <p><a href="https://stripe.com/gb">Click here to view your stripe account</a></p>
            </div>
            ):
            <div>
                <Button type="submit" onClick={generateOnboardingLink}>
                    {isStripeSetupLoading ? <Spinner /> : "Click here to set up your stripe account"}
                </Button>            
            </div>
            }
                
        </div>
    );

}
