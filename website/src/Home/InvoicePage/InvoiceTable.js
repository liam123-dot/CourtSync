import React, { useState, useContext } from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import axios from 'axios';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useTheme, useMediaQuery, Tab } from '@mui/material';
import {LessonCost} from '../CoachHomeScreen/LessonDetailsModal2'
import ConfirmationDialog from '../ConfirmationDialog';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Modal from '@mui/material/Modal';
import { usePopup } from '../../Notifications/PopupContext';
import { InvoiceDataContext } from './InvoicePage';

function LessonCostModal({ open, handleClose, lesson }) {
  if (!lesson) return;
  console.log(lesson);
  lesson['duration_minutes'] = lesson['duration'];
  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'white', padding: 4 }}>
        <IconButton 
          onClick={handleClose} 
          sx={{ position: 'absolute', right: 0, top: 0 }}
        >
          <CloseIcon />
        </IconButton>
        <LessonCost booking={lesson} forceExpanded={true}/>
      </Box>
    </Modal>
  );
}

const getEpochRange = (row) => {
  console.log(row);
  let startDate, endDate;
  const year = row.year;
  
  if (row.day && row.month) {
    // Daily frequency
    startDate = new Date(year, row.month - 1, row.day);
    endDate = new Date(year, row.month - 1, row.day + 1);
  } else if (row.week) {
    // Weekly frequency
    startDate = new Date(year, 0, (row.week - 1) * 7);
    endDate = new Date(year, 0, row.week * 7);
  } else if (row.month) {
    // Monthly frequency
    startDate = new Date(year, row.month - 1);
    endDate = new Date(year, row.month);
  }

  return [startDate.getTime() / 1000, endDate.getTime() / 1000]; // Convert to epoch
};

function InvoiceRow(props) {
  const { row, tab } = props;
  const [open, setOpen] = React.useState(false);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const [confirmMarkPaidOpen, setConfirmMarkPaidOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const [isMarkingPaid, setIsMarkingPaid] = useState(false); // New state for loading indicator
  const [isDeleting, setIsDeleting] = useState(false); // New state for loading indicator

  const {fetchInvoiceData, view, statusView} = useContext(InvoiceDataContext);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const { showPopup } = usePopup();

  const handleModalOpen = (lesson) => {
    setSelectedLesson(lesson);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedLesson(null);
  };

  const handleMarkInvoicePaid = async () => {

    setIsMarkingPaid(true);
    setConfirmMarkPaidOpen(false);

    try {
        if (row.invoice_sent) {
        
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/invoices/${row.invoice_id}/paid`,
            {},
            {
              headers: {
                Authorization: localStorage.getItem('AccessToken') 
              }
            }
          )     
          } else {
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/invoices/paid`, {
              booking_ids: row.booking_ids
            }, {
              headers: {
                Authorization: localStorage.getItem('AccessToken') 
              }
            });
          }
      showPopup('Invoice marked as paid');
      fetchInvoiceData(view, statusView);

    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      // Handle error appropriately
    }

    setIsMarkingPaid(false);

  }

  const handleDeleteInvoice = async () => {
    setIsDeleting(true);
    try {

      if (row.invoice_sent){
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/invoices/${row.invoice_id}/cancel`, {}, 
        { headers:
        {
          Authorization: localStorage.getItem('AccessToken')
        }});
      } else {
        const response = await axios.put(`${process.env.REACT_APP_API_URL}/invoices/cancel`, {
          booking_ids: row.booking_ids
        }, {
          headers: {
            Authorization: localStorage.getItem('AccessToken')           
          }
        });     
      } 
      setConfirmDeleteOpen(false);
      fetchInvoiceData(view, statusView);
      showPopup('Invoice cancelled');

     } catch (error) {
      console.error('Error deleting invoice:', error);
      // Handle error appropriately
     }
     setIsDeleting(false);

  }

  const loadHistory = async () => {
    if (!historyLoaded) {
      const [startEpoch, endEpoch] = getEpochRange(row);

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/invoices/time-range`, {
          headers: {
            Authorization: localStorage.getItem('AccessToken') 
          },
          params: {
            start_time: startEpoch,
            end_time: endEpoch,
            contact_email: row.contact_email,
            paid: row.paid,
            invoice_sent: row.invoice_sent,
            invoice_id: row.invoice_id,
            // Include other parameters if needed
          }
        });
        row.history = response.data.invoices; // Adjust according to the API response structure
        setHistoryLoaded(true);
      } catch (error) {
        console.error('Error loading invoice history:', error);
        // Handle error appropriately
      }
    }
  };

  const handleExpand = () => {
    setOpen(!open);
    loadHistory();
  }

  return (
    <React.Fragment>
      <TableRow 
        sx={{ 
          '& > *': { borderBottom: 'unset' }, 
          cursor: 'pointer' 
        }} 
        onClick={handleExpand}
      >        
        <TableCell>
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}          
        </TableCell>
        <TableCell component="th" scope="row">
          {row.contact_name}
        </TableCell>
        {!isSmallScreen && <TableCell align="right">{row.contact_email}</TableCell>}
        <TableCell align="right">{row.bookings_count}</TableCell>
        {!isSmallScreen && <TableCell align="right">£{(row.total_cost / 100.0).toFixed(2)}</TableCell>}
        {
          (tab !== 'upcoming') && (
            <>
              {!isSmallScreen && <TableCell align="right">{row.invoice_sent ? 'Yes' : 'No'}</TableCell>}
              {!isSmallScreen && <TableCell align="right">{row.paid ? 'Yes' : 'No'}</TableCell>}
            </>
          )
        }
        {
          tab === 'upcoming' && (
            <TableCell align="right">
              {row.send_date}
            </TableCell>
          )
        }
        {/* Additional cells for actions like marking paid or deleting, only if invoice is not cancelled */}
        {!row.invoice_cancelled && (
          <>
            {!row.paid && (
              <TableCell align="right" size="small">
                {/* Green Tick IconButton */}
                {isMarkingPaid ? (
                  <CircularProgress size={24} />
                ) : (
                  <IconButton
                    aria-label="confirm action"
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmMarkPaidOpen(true)
                    }}
                    sx={{ color: 'green' }} // Reduced margin
                  >
                    <CheckCircleIcon />
                  </IconButton>
                )}
              </TableCell>
            )}
            {!row.paid && (
              <TableCell align="right" size="small">
                {/* Red Close IconButton */}
                {isDeleting ? (
                  <CircularProgress size={24} />
                ) : (
                  <IconButton
                    aria-label="delete invoice"
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteOpen(true);
                    }}
                    sx={{ color: 'red' }}
                  >
                    <CloseIcon />
                  </IconButton>
                )}
              </TableCell>
            )}
          </>
        )}
        {
          row.invoice_cancelled && (
            <TableCell align="right" size="small">
              Cancelled
            </TableCell>
          )
        }
      </TableRow>
      <TableRow>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={isSmallScreen ? 4 : 8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>
              <Typography variant="h6" gutterBottom component="div">
                Lessons
              </Typography>
              {row.history ? (
                <Table size="small" aria-label="purchases">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Player</TableCell>
                      <TableCell align='right'>Total price (£)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {row.history.map((historyRow) => (
                      <TableRow key={historyRow.date}>
                        <TableCell component="th" scope="row">
                            {new Date(historyRow.start_time * 1000).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: '2-digit'
                            })}
                        </TableCell>
                        <TableCell>{historyRow.player_name}</TableCell>
                        <TableCell align='right'>
                          £{(historyRow.cost / 100.0).toFixed(2)}
                          <IconButton onClick={() => handleModalOpen(historyRow)}>
                            <VisibilityIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <CircularProgress/>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
      <LessonCostModal open={modalOpen} handleClose={handleModalClose} lesson={selectedLesson} />
      <ConfirmationDialog
        open={confirmMarkPaidOpen}
        onCancel={() => setConfirmMarkPaidOpen(false)}
        onConfirm={handleMarkInvoicePaid}
        title="Mark invoice as externally paid?"
      />
      <ConfirmationDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteInvoice}
        title="Cancel invoice?"
      />

    </React.Fragment>
  );
}

InvoiceRow.propTypes = {
  row: PropTypes.shape({
    contact_name: PropTypes.string.isRequired,
    contact_email: PropTypes.string.isRequired,
    bookings_count: PropTypes.number.isRequired,
    total_cost: PropTypes.string.isRequired,
    invoice_sent: PropTypes.bool.isRequired,
    paid: PropTypes.bool.isRequired,
    month: PropTypes.number.isRequired,
    year: PropTypes.number.isRequired,
    history: PropTypes.array, // Can be null initially
  }).isRequired,
};

export default function InvoiceTable({data, tab}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  return data && (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Contact Name</TableCell>
            { !isSmallScreen && <TableCell align="right">Contact Email</TableCell> }
            <TableCell align="right">Lesson Count</TableCell>
            { !isSmallScreen && <TableCell align="right">Total Cost</TableCell> }
            {
              !isSmallScreen && tab === 'upcoming' && (
                <TableCell align="right">Sending Date</TableCell>
              )
            }
            { tab !=='upcoming' && (
              <>
                { !isSmallScreen && <TableCell align="right">Invoice Sent</TableCell> }
                { !isSmallScreen && <TableCell align="right">Paid</TableCell> }
              </>
            )            
            }
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => {
            return <InvoiceRow key={index} row={row} tab={tab} />
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}