import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, CircularProgress, Container, Grid, TextField, Typography } from '@mui/material';
import AddNewPricingRuleComponent from './AddNewPricingRuleComponent';
import PricingRule from './PricingRuleComponent';
import { useSettingsLabels } from '../../../SettingsPage2';
import { usePopup } from '../../../../Notifications/PopupContext';
import { IconButton, Tooltip } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo } from '@fortawesome/free-solid-svg-icons';

export default function CostInput() {

    const [price, setPrice] = useState(''); // Store the price as a string
    const [isSaving, setIsSaving] = useState(false);
    const [isExtraRulesLoading, setIsExtraRulesLoading] = useState(false);
    const [isDefaultPriceLoading, setIsDefaultPriceLoading] = useState(false);

    const [addingRule, setAddingRule] = useState(false);
    const [pricingRules, setPricingRules] = useState([]);

    const { refreshLabels } = useSettingsLabels();

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

        setIsExtraRulesLoading(true);

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

        setIsExtraRulesLoading(false);

    }

    useEffect(() => {

        const getPrice = async () => {
          setIsDefaultPriceLoading(true);
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
            setIsDefaultPriceLoading(false);
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
            refreshLabels();

        } catch (error) {
            console.error(error);
        }

        setIsSaving(false);

    }
    return (
      <Container sx={{ textAlign: 'left', p: 2 }}>
        <Tooltip title="Set your cost per hour for lessons as well as additional costs or fixed costs that may occur. Additional costs can also be added by editing bookings.">
            <IconButton
                onClick={() => setShowDescription(!showDescription)}
            >
                <FontAwesomeIcon icon={faInfo} />
            </IconButton>  
        </Tooltip>
  
          <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                  <Typography>Lesson Cost per Hour:</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                  {isDefaultPriceLoading ? (
                      <CircularProgress/>
                  ) : (
                      <>
                          <TextField
                              type="text"
                              value={price}
                              onChange={handlePriceChange}
                              placeholder="0.00"
                              InputProps={{
                                  startAdornment: <Typography>£</Typography>,
                              }}
                              sx={{ marginRight: 2 }}
                          />
                          <Button variant="contained" color="primary" onClick={handleSave} disabled={isSaving}>
                              {isSaving ? <CircularProgress size={24} /> : 'Save'}
                          </Button>
                      </>
                  )}
              </Grid>
          </Grid>

          {!isExtraRulesLoading ? (
              <>
                  <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Extra Rules</Typography>
                  
                  {/* Column Headers */}
                  <Grid container spacing={2} alignItems="center" sx={{ mb: 1, fontWeight: 'bold' }}>
                      <Grid item xs={2}>Label</Grid>
                      <Grid item xs={2}>Time</Grid>
                      <Grid item xs={2}>Date/Days</Grid>
                      <Grid item xs={2}>Rate</Grid>
                      <Grid item xs={3}>Type</Grid>
                      <Grid item xs={1}>Action</Grid>
                  </Grid>

                  {pricingRules.map((rule, index) => (
                      <PricingRule key={index} pricingRule={rule} refresh={getRules}/>
                  ))}
                  {addingRule && <AddNewPricingRuleComponent setShown={setAddingRule} refresh={getRules}/>}

                    {!addingRule && (
                    <Button variant="contained" onClick={() => setAddingRule(!addingRule)} sx={{ mt: 2 }}>
                        Add New Rule
                    </Button>
                    )}
              </>
          ) : (
              <CircularProgress/>
          )}
      </Container>
  );
}