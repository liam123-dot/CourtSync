import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { SaveButton } from '../../../../Home/CommonAttributes/SaveButton';
import { Spinner } from '../../../../Spinner';
import { usePopup } from '../../../../Notifications/PopupContext';
import AddNewPricingRuleComponent from './AddNewPricingRuleComponent';
import PricingRule from './PricingRuleComponent';

const Container = styled.div`
  padding: 20px;
`;

const Heading = styled.h3`
  color: #333;
  font-weight: 500;
  margin-bottom: 20px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-bottom: 20px;
`;

const StyledInput = styled.input`
  padding: 10px;
  margin: 0 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
  text-align: right;
`;

const StyledButton = styled.button`
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #45a049;
  }
`;

export default function CostInput() {

    const [price, setPrice] = useState(''); // Store the price as a string
    const [isSaving, setIsSaving] = useState(false);

    const [addingRule, setAddingRule] = useState(false);
    const [pricingRules, setPricingRules] = useState([]);

    const { showPopup } = usePopup();

    const handlePriceChange = (e) => {
        const value = e.target.value;

        // Check if the input is a valid number or decimal
        if (!/^(\d+\.?\d*|\.\d+)$/.test(value) && value !== '') {
            return;
        }

        setPrice(value); // Store the price as a string
    };

    const getRules = async () => {

        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/pricing-rules?include_default=False`,{
                headers: {
                    Authorization: localStorage.getItem('AccessToken')
                }
            });

            setPricingRules(response.data);
            
        } catch (error) {
            console.error(error);
        }

    }

    useEffect(() => {

        const getPrice = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/features/hourly-rate`,
                    {
                        headers: {
                            Authorization: localStorage.getItem('AccessToken')
                        }
                    });
                console.log(response.data);
                setPrice(response.data.hourly_rate / 100);
            } catch (error) {
                console.error(error);
            }
        }

        getPrice();
        getRules();

    }, []);

    const handleSave = async () => {

        setIsSaving(true);

        try {
            const response = await axios.put(
                `${process.env.REACT_APP_API_URL}/features`,
                {
                    default_lesson_cost: price * 100
                },
                {
                    headers: {
                        Authorization: localStorage.getItem('AccessToken')
                    }
                }
            )

            showPopup('Success');

        } catch (error) {
            console.error(error);
        }

        setIsSaving(false);

    }
    return (
        <Container>
          <Heading>
            Set your cost per hour for lessons as well as additional costs or fixed costs that may occur. 
            Additional costs can also be added by editing bookings
          </Heading>
    
          <InputContainer>
            <p>Lesson Cost per Hour:</p>
            <span>£</span>
            <StyledInput
              type="text"
              value={price}
              onChange={handlePriceChange}
              placeholder="0.00"
            />
            <SaveButton onClick={handleSave}>
              {isSaving ? <Spinner /> : 'Save'}
            </SaveButton>
          </InputContainer>
    
          <InputContainer>
            <Heading>Extra Rules</Heading>
            <StyledButton onClick={() => setAddingRule(true)}>Add New Rule</StyledButton>
          </InputContainer>
    
          {addingRule && 
            <AddNewPricingRuleComponent setShown={setAddingRule} refresh={getRules}/>
          }
    
          {pricingRules.map((rule, index) => (
            <PricingRule key={index} pricingRule={rule} refresh={getRules}/>
          ))}
        </Container>
      );
}