import React, {useState} from "react";
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { dateCalendarClasses } from "@mui/x-date-pickers";

export default function LessonCostComponent({ data }) {

    const [expanded, setExpanded] = useState(false);

    /*
    data is an object.
    keys are:
    cost: total cost in pennies
    hourly: hourly pricing rule
    extra: extra rules applied    
    */
    const durationInHours = Math.floor(data.duration / 60);
    const durationInMinutes = data.duration % 60;

    return data && (

        <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>

            <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel1a-content"
                id="panel1a-header"
            >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography sx={{ flexShrink: 0 }}>
                        Lesson Cost: 
                    </Typography>
                    <Typography sx={{ color: 'text.secondary', marginLeft: 'auto' }}>
                        £{(data.cost / 100.0).toFixed(2)}
                    </Typography>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                <Typography>
                    {data.rules && data.rules.hourly && (
                        <>
                            <div>Hourly Rate: £{(data.rules.hourly.rate / 100.0).toFixed(2)}</div>
                            <div style={{
                                color: 'grey.500', // For lighter grey color
                                fontSize: 'small', // For smaller text
                                fontStyle: 'italic' // For italic text
                            }}>Duration: {durationInHours}H{durationInMinutes !== 0 && `: ${durationInMinutes}M`}</div>
                        </>
                    )}                                      
                    {/* {data.hourly && <div>Hourly rate: £{(data.hourly / 100.0).toFixed(2)}</div>} */}
                    {/* {data.extra && <div>Extra: £{(data.extra / 100.0).toFixed(2)}</div>} */}
                </Typography>
                <Typography>
                    {data.rules && data.rules.extra && data.rules.extra.length > 0 && (
                        <div>
                            Extra Costs:
                            {data.rules.extra.map((rule, index) => (
                                <Typography 
                                    key={index} 
                                    variant="body2" 
                                    sx={{ 
                                        color: 'text.secondary', 
                                        fontStyle: 'italic' 
                                    }}
                                >
                                    {rule.label}: £{(rule.rate / 100.0).toFixed(2)}
                                </Typography>
                            ))}
                        </div>
                        )
                    }
                                                              
                </Typography>
                
            </AccordionDetails>

        </Accordion>

    )

}
