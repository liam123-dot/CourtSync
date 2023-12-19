import React, { useState } from 'react';
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
import {LessonCost} from '../CoachHomeScreen/LessonDetailsModal2'
import Modal from '@mui/material/Modal';

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
  const { row } = props;
  const [open, setOpen] = React.useState(false);
  const [historyLoaded, setHistoryLoaded] = React.useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);

  const handleModalOpen = (lesson) => {
    setSelectedLesson(lesson);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedLesson(null);
  };

  const loadHistory = async () => {
    if (!historyLoaded) {
      const [startEpoch, endEpoch] = getEpochRange(row);

      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/invoices/time-range`, {
          headers: {
            Authorization: localStorage.getItem('AccessToken') // Replace with actual token retrieval method
          },
          params: {
            start_time: startEpoch,
            end_time: endEpoch,
            contact_email: row.contact_email,
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

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {
              setOpen(!open);
              loadHistory();
            }}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row">
          {row.contact_name}
        </TableCell>
        <TableCell align="right">{row.contact_email}</TableCell>
        <TableCell align="right">{row.bookings_count}</TableCell>
        <TableCell align="right">£{(row.total_cost / 100.0).toFixed(2)}</TableCell>
        <TableCell align="right">{row.invoice_sent ? 'Yes' : 'No'}</TableCell>
        <TableCell align="right">{row.paid ? 'Yes' : 'No'}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
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
    </React.Fragment>
  );
}

InvoiceRow.propTypes = {
  row: PropTypes.shape({
    contactName: PropTypes.string.isRequired,
    contactEmail: PropTypes.string.isRequired,
    bookingsCount: PropTypes.number.isRequired,
    totalCost: PropTypes.string.isRequired,
    invoiceSent: PropTypes.bool.isRequired,
    paid: PropTypes.bool.isRequired,
    month: PropTypes.number.isRequired,
    year: PropTypes.number.isRequired,
    history: PropTypes.array, // Can be null initially
  }).isRequired,
};

export default function InvoiceTable({data}) {
  // console.log(data);
  return data && (
    <TableContainer component={Paper}>
      <Table aria-label="collapsible table">
        <TableHead>
          <TableRow>
            <TableCell />
            <TableCell>Contact Name</TableCell>
            <TableCell align="right">Contact Email</TableCell>
            <TableCell align="right">Lesson Count</TableCell>
            <TableCell align="right">Total Cost</TableCell>
            <TableCell align="right">Invoice Sent</TableCell>
            <TableCell align="right">Paid</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, index) => {
            return <InvoiceRow key={index} row={row} />
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
