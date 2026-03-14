import { useState, useEffect } from 'react';
import { Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, InputAdornment, Pagination, MenuItem, Select, FormControl, Tooltip, ThemeProvider, createTheme, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, FormControlLabel, Switch } from '@mui/material';
import { Search, FilterAlt, Payment } from '@mui/icons-material';
import PrintIcon from '@mui/icons-material/Print';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router } from '@inertiajs/react';
import TransactionFilter from './Filter';
import MembershipInvoiceSlip from '../Membership/Invoice';
import BookingInvoiceModal from '@/components/App/Rooms/BookingInvoiceModal';
import EventBookingInvoiceModal from '@/components/App/Events/EventBookingInvoiceModal';
import PaymentDialog from '@/components/App/Transactions/PaymentDialog';
import axios from 'axios';
import { enqueueSnackbar } from 'notistack';
import dayjs from 'dayjs';

// const drawerWidthOpen = 240;
// const drawerWidthClosed = 110;

const Transaction = ({ transactions, filters, users, transactionTypes, subscriptionCategories, financialChargeTypes }) => {
    // Modal state
    // const [open, setOpen] = useState(true);
    const [openMembershipInvoiceModal, setOpenMembershipInvoiceModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [showRoomInvoiceModal, setShowRoomInvoiceModal] = useState(false);
    const [showEventInvoiceModal, setShowEventInvoiceModal] = useState(false);
    const [selectedBookingId, setSelectedBookingId] = useState(null);
    const [transactionList, setTransactionList] = useState(transactions);
    // const [searchQuery, setSearchQuery] = useState(filters?.search || ''); // Search handled by Filter component now
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Bulk Action State
    const [selectedIds, setSelectedIds] = useState([]);
    const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
    const [overdueDialogOpen, setOverdueDialogOpen] = useState(false);
    const [bulkAmount, setBulkAmount] = useState('');
    const [bulkIsPercent, setBulkIsPercent] = useState(false);
    const [isSubmittingBulk, setIsSubmittingBulk] = useState(false);

    // Handle Checkbox Select All
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            const newSelecteds = transactions.data.map((n) => n.id);
            setSelectedIds(newSelecteds);
        } else {
            setSelectedIds([]);
        }
    };

    // Handle Checkbox Select Single
    const handleSelectClick = (event, id) => {
        const selectedIndex = selectedIds.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selectedIds, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selectedIds.slice(1));
        } else if (selectedIndex === selectedIds.length - 1) {
            newSelected = newSelected.concat(selectedIds.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selectedIds.slice(0, selectedIndex), selectedIds.slice(selectedIndex + 1));
        }
        setSelectedIds(newSelected);
    };

    const isSelected = (id) => selectedIds.indexOf(id) !== -1;

    // Bulk Action Handlers
    const handleBulkSubmit = async (type) => {
        if (!bulkAmount) {
            enqueueSnackbar('Please enter an amount', { variant: 'error' });
            return;
        }

        setIsSubmittingBulk(true);
        const endpoint = type === 'discount' ? route('finance.transaction.bulk-discount') : route('finance.transaction.bulk-overdue');

        try {
            const response = await axios.post(endpoint, {
                ids: selectedIds,
                amount: bulkAmount,
                is_percent: bulkIsPercent,
            });

            if (response.data.success) {
                enqueueSnackbar(response.data.message, { variant: 'success' });
                // Reset state
                setSelectedIds([]);
                setBulkAmount('');
                setBulkIsPercent(false);
                if (type === 'discount') setDiscountDialogOpen(false);
                else setOverdueDialogOpen(false);

                // Reload data
                router.reload();
            }
        } catch (error) {
            console.error('Bulk action error:', error);
            enqueueSnackbar(error.response?.data?.message || 'Action failed', { variant: 'error' });
        } finally {
            setIsSubmittingBulk(false);
        }
    };

    // Handle per page change
    const handlePerPageChange = (event) => {
        const newPerPage = event.target.value;
        setPerPage(newPerPage);
        // Preserve other filters when changing per_page
        router.get(
            route('finance.transaction'),
            { ...filters, per_page: newPerPage },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    // Handle page change
    const handlePageChange = (event, value) => {
        router.get(
            transactions.links[value].url,
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Payment Confirmation State
    const [paymentConfirmationOpen, setPaymentConfirmationOpen] = useState(false);
    const [transactionToPay, setTransactionToPay] = useState(null);

    // Payment Confirmation Handlers
    const handlePayClick = (transaction) => {
        setTransactionToPay(transaction);
        setPaymentConfirmationOpen(true);
    };

    const [submittingPayment, setSubmittingPayment] = useState(false);

    const handleConfirmPayment = async (paymentData) => {
        if (!transactionToPay) return;

        setSubmittingPayment(true);
        const formData = new FormData();
        formData.append('status', 'paid');
        formData.append('payment_method', paymentData.payment_method);
        if (paymentData.payment_method === 'credit_card') {
            formData.append('credit_card_type', paymentData.credit_card_type);
            if (paymentData.receipt_file) {
                formData.append('receipt_file', paymentData.receipt_file);
            }
        }

        try {
            const response = await axios.post(route('finance.transaction.update-status', transactionToPay.id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                enqueueSnackbar('Invoice marked as paid successfully!', { variant: 'success' });
                // Refresh transactions using Inertia reload
                router.reload({ only: ['transactions'] });
                setPaymentConfirmationOpen(false);
                setTransactionToPay(null);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            enqueueSnackbar(error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'Failed to update status', { variant: 'error' });
        } finally {
            setSubmittingPayment(false);
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        if (!amount) return 'Rs 0';
        return `Rs ${parseFloat(amount).toLocaleString()}`;
    };

    // Helper function to format date
    const formatDate = (date) => {
        if (!date) return '';
        try {
            return dayjs(date).format('DD-MM-YYYY');
        } catch (error) {
            return date;
        }
    };

    const pageTotals = (transactions?.data || []).reduce(
        (acc, t) => {
            const amount = Number(t?.total_price ?? t?.amount ?? 0) || 0;
            const paid = Number(t?.paid_amount ?? 0) || 0;
            const balance = Number(t?.balance ?? 0) || 0;
            return {
                amount: acc.amount + amount,
                paid: acc.paid + paid,
                balance: acc.balance + balance,
            };
        },
        { amount: 0, paid: 0, balance: 0 },
    );

    return (
        <>
            <div className="container-fluid p-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
                {/* Recently Joined Section */}
                <div className="mx-0">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <Typography style={{ fontWeight: 700, fontSize: '30px', color: '#063455' }}>Transactions</Typography>
                        </div>
                        <div className="d-flex align-items-center">
                            <FormControl
                                size="small"
                                sx={{
                                    width: '80px',
                                    marginRight: '10px',
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '16px',
                                    },
                                    '& .MuiOutlinedInput-notchedOutline': {
                                        borderRadius: '16px',
                                    },
                                }}
                            >
                                <Select value={perPage} onChange={handlePerPageChange} displayEmpty>
                                    <MenuItem value={10}>10</MenuItem>
                                    <MenuItem value={25}>25</MenuItem>
                                    <MenuItem value={50}>50</MenuItem>
                                    <MenuItem value={100}>100</MenuItem>
                                </Select>
                            </FormControl>

                            <Button
                                variant="contained"
                                startIcon={<PrintIcon />}
                                sx={{
                                    backgroundColor: '#063455',
                                    textTransform: 'none',
                                    color: 'white',
                                    borderRadius: '16px',
                                }}
                            >
                                Print
                            </Button>
                        </div>
                    </div>
                    <Typography sx={{ color: '#063455', fontSize: '15px', fontWeight: '600' }}>View and manage all recorded financial transactions</Typography>

                    {/* Inline Filter */}
                    <TransactionFilter transactionTypes={transactionTypes} users={users} subscriptionCategories={subscriptionCategories} financialChargeTypes={financialChargeTypes} />

                    {/* Bulk Actions Toolbar */}
                    {selectedIds.length > 0 && (
                        <Paper
                            sx={{
                                p: 2,
                                mt: 2,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #90caf9',
                            }}
                        >
                            <Typography variant="body1" color="primary" fontWeight={600}>
                                {selectedIds.length} invoice(s) selected
                            </Typography>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <Button variant="contained" color="primary" onClick={() => setDiscountDialogOpen(true)}>
                                    Apply Discount
                                </Button>
                                <Button variant="contained" color="error" onClick={() => setOverdueDialogOpen(true)}>
                                    Apply Overdue
                                </Button>
                                <Button variant="outlined" color="primary" onClick={() => setSelectedIds([])}>
                                    Clear Selection
                                </Button>
                            </div>
                        </Paper>
                    )}

                    {/* Transactions Table */}
                    <TableContainer component={Paper} style={{ boxShadow: 'none', marginTop: '2rem', overflowX: 'auto', borderRadius: '12px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455', height: '30px' }}>
                                    <TableCell padding="checkbox">
                                        <Checkbox color="primary" indeterminate={selectedIds.length > 0 && selectedIds.length < transactions.data.length} checked={transactions.data.length > 0 && selectedIds.length === transactions.data.length} onChange={handleSelectAll} sx={{ color: 'white', '&.Mui-checked': { color: 'white' }, '&.MuiCheckbox-indeterminate': { color: 'white' } }} />
                                    </TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Invoice No</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Member</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Type</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Amount</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Paid</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Balance</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Status</TableCell>
                                    {/* <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Payment Method</TableCell> */}
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Date</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Days</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>From</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>To</TableCell>
                                    <TableCell sx={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>Action</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.data && transactions.data.length > 0 ? (
                                    transactions.data.map((transaction) => {
                                        const isItemSelected = isSelected(transaction.id);
                                        // Format fee type
                                        const formatType = (type) => {
                                            if (!type) return 'N/A';
                                            return type
                                                .replace(/_/g, ' ')
                                                .split(' ')
                                                .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                                                .join(' ');
                                        };
                                        const displayType = transaction.fee_type_formatted || transaction.fee_type || transaction.invoice_type;

                                        // Format date
                                        const formatDate = (date) => {
                                            if (!date) return 'N/A';
                                            try {
                                                return dayjs(date).format('DD-MM-YYYY');
                                            } catch (e) {
                                                return 'N/A';
                                            }
                                        };

                                        // Status Badge
                                        const getStatusBadge = (status) => {
                                            // Adjust status based on balance if needed, but using DB status for badge color
                                            // Logic: Paid if balance <= 0 (floating point tolerance)
                                            // Partial if paid > 0 and balance > 0
                                            // Unpaid if paid == 0
                                            // We can rely on backend/DB status mostly, but let's trust the calc vals too
                                            const formattedText = status ? status.replace(/_/g, ' ') : 'N/A';
                                            const styles = {
                                                paid: { bg: '#d4edda', color: '#155724' },
                                                unpaid: { bg: '#f8d7da', color: '#721c24' },
                                                default: { bg: '#e2e3e5', color: '#383d41' },
                                            };
                                            // Force status display based on balance? Or mostly trust DB?
                                            // DB status is accurate if updated correctly.
                                            return styles[status] || styles.default;
                                        };
                                        const statusStyle = getStatusBadge(transaction.status);

                                        return (
                                            <TableRow key={transaction.id} style={{ borderBottom: '1px solid #eee' }} hover onClick={(event) => handleSelectClick(event, transaction.id)} role="checkbox" aria-checked={isItemSelected} selected={isItemSelected}>
                                                <TableCell padding="checkbox">
                                                    <Checkbox color="primary" checked={isItemSelected} />
                                                </TableCell>
                                                <TableCell sx={{ color: '#000', fontWeight: 600, fontSize: '16px' }}>{transaction.invoice_no || 'N/A'}</TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                    <Tooltip title={transaction.member?.full_name || transaction.corporate_member?.full_name || transaction.customer?.name || transaction.invoiceable?.name || 'N/A'} arrow>
                                                        <div style={{ fontWeight: 500, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '120px' }}>{transaction.member?.full_name || transaction.corporate_member?.full_name || transaction.customer?.name || transaction.invoiceable?.name || 'N/A'}</div>
                                                    </Tooltip>
                                                    {(transaction.member?.membership_no || transaction.corporate_member?.membership_no) && <div style={{ fontSize: '12px', color: '#7F7F7F' }}>{transaction.member?.membership_no || transaction.corporate_member?.membership_no}</div>}
                                                </TableCell>

                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                                    <span style={{ backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                                        {displayType === 'Multiple Items' ? (
                                                            <Tooltip
                                                                title={
                                                                    transaction.items && transaction.items.length > 0 ? (
                                                                        <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                                                                            {transaction.items.map((item, idx) => (
                                                                                <li key={idx}>
                                                                                    {item.fee_type_formatted || formatType(item.fee_type)} {item.description}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        'Multiple items'
                                                                    )
                                                                }
                                                                arrow
                                                            >
                                                                <span>{displayType}</span>
                                                            </Tooltip>
                                                        ) : (
                                                            formatType(displayType)
                                                        )}
                                                    </span>
                                                </TableCell>

                                                <TableCell sx={{ color: '#7F7F7F', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px' }}>
                                                    <Tooltip title={(transaction.total_price || transaction.amount || 0).toLocaleString()} arrow>
                                                        Rs {(transaction.total_price || transaction.amount || 0).toLocaleString()}
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ color: 'success.main', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px' }}>
                                                    <Tooltip title={(transaction.paid_amount || 0).toLocaleString()} arrow>
                                                        Rs {(transaction.paid_amount || 0).toLocaleString()}
                                                    </Tooltip>
                                                </TableCell>
                                                <TableCell sx={{ color: 'error.main', fontWeight: 500, fontSize: '14px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px' }}>
                                                    <Tooltip title={(transaction.balance || 0).toLocaleString()} arrow>
                                                        Rs {(transaction.balance || 0).toLocaleString()}
                                                    </Tooltip>
                                                </TableCell>

                                                <TableCell>
                                                    <span style={{ backgroundColor: statusStyle.bg, color: statusStyle.color, padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 500 }}>{transaction.status ? transaction.status : 'N/A'}</span>
                                                </TableCell>

                                                {/* <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>{formatPaymentMethod(transaction.payment_method)}</TableCell> */}
                                                <TableCell sx={{ color: '#7F7F7F', fontSize: '14px', whiteSpace: 'nowrap' }}>{formatDate(transaction.issue_date)}</TableCell>

                                                <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                    {(() => {
                                                        // Get dates from items
                                                        const itemsWithDates = transaction.items?.filter((item) => item.start_date && item.end_date) || [];
                                                        if (itemsWithDates.length > 0) {
                                                            const startDate = itemsWithDates.reduce((min, item) => (!min || dayjs(item.start_date).isBefore(dayjs(min)) ? item.start_date : min), null);
                                                            const endDate = itemsWithDates.reduce((max, item) => (!max || dayjs(item.end_date).isAfter(dayjs(max)) ? item.end_date : max), null);
                                                            return dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
                                                        }
                                                        return '-';
                                                    })()}
                                                </TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                    {(() => {
                                                        const itemsWithDates = transaction.items?.filter((item) => item.start_date) || [];
                                                        if (itemsWithDates.length > 0) {
                                                            const startDate = itemsWithDates.reduce((min, item) => (!min || dayjs(item.start_date).isBefore(dayjs(min)) ? item.start_date : min), null);
                                                            return dayjs(startDate).format('DD-MM-YYYY');
                                                        }
                                                        return '-';
                                                    })()}
                                                </TableCell>
                                                <TableCell sx={{ color: '#7F7F7F', fontSize: '14px' }}>
                                                    {(() => {
                                                        const itemsWithDates = transaction.items?.filter((item) => item.end_date) || [];
                                                        if (itemsWithDates.length > 0) {
                                                            const endDate = itemsWithDates.reduce((max, item) => (!max || dayjs(item.end_date).isAfter(dayjs(max)) ? item.end_date : max), null);
                                                            return dayjs(endDate).format('DD-MM-YYYY');
                                                        }
                                                        return '-';
                                                    })()}
                                                </TableCell>

                                                <TableCell sx={{ display: 'flex', gap: '4px' }}>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        style={{ textTransform: 'none', color: '#063455', borderColor: '#063455', padding: '2px 8px', fontSize: '12px' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // Prevent row click
                                                            // View Logic (Keep existing modal logic if desired, or simplified)
                                                            if (transaction.invoice_type === 'room_booking' && transaction.invoiceable_id) {
                                                                setSelectedBookingId(transaction.invoiceable_id);
                                                                setShowRoomInvoiceModal(true);
                                                            } else if (transaction.invoice_type === 'event_booking' && transaction.invoiceable_id) {
                                                                setSelectedBookingId(transaction.invoiceable_id);
                                                                setShowEventInvoiceModal(true);
                                                            } else {
                                                                setSelectedInvoiceId(transaction.id);
                                                                setOpenMembershipInvoiceModal(true);
                                                            }
                                                        }}
                                                    >
                                                        View
                                                    </Button>
                                                    {(transaction.balance > 0 || transaction.status === 'unpaid') && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="success"
                                                            startIcon={<Payment sx={{ fontSize: '16px' }} />}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                router.visit(route('finance.invoice.pay', transaction.id));
                                                            }}
                                                            sx={{ fontSize: '11px', py: 0.5, px: 1, whiteSpace: 'nowrap', textTransform: 'none' }}
                                                        >
                                                            Pay
                                                        </Button>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={13} align="center" sx={{ py: 4, color: '#7F7F7F' }}>
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                )}
                                <TableRow style={{ backgroundColor: '#e3f2fd' }}>
                                    <TableCell padding="checkbox" />
                                    <TableCell colSpan={3} sx={{ fontWeight: 700, color: '#063455' }}>
                                        Grand Total
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: '#063455', whiteSpace: 'nowrap' }}>Rs {pageTotals.amount.toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'success.main', whiteSpace: 'nowrap' }}>Rs {pageTotals.paid.toLocaleString()}</TableCell>
                                    <TableCell sx={{ fontWeight: 700, color: 'error.main', whiteSpace: 'nowrap' }}>Rs {pageTotals.balance.toLocaleString()}</TableCell>
                                    <TableCell colSpan={6} />
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {transactions.last_page > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                            <Typography style={{ fontSize: '14px', color: '#7F7F7F' }}>
                                Page {transactions.current_page} of {transactions.last_page}
                            </Typography>
                            <Pagination count={transactions.last_page} page={transactions.current_page} onChange={handlePageChange} color="primary" showFirstButton showLastButton />
                        </div>
                    )}
                </div>
                {/* <TransactionFilter open={openFilterModal} onClose={() => setOpenFilterModal(false)} currentFilters={filters} onApply={handleFilterApply} /> */}

                {/* Membership Invoice Modal - Used for Membership, Subscription & Maintenance Fees */}
                <MembershipInvoiceSlip
                    open={openMembershipInvoiceModal}
                    onClose={() => {
                        setOpenMembershipInvoiceModal(false);
                        setSelectedInvoiceId(null);
                    }}
                    invoiceId={selectedInvoiceId}
                />


                {/* Room Booking Invoice Modal */}
                <BookingInvoiceModal
                    open={showRoomInvoiceModal}
                    onClose={() => {
                        setShowRoomInvoiceModal(false);
                        setSelectedBookingId(null);
                    }}
                    bookingId={selectedBookingId}
                    setBookings={setTransactionList}
                    financeView={true}
                />

                {/* Event Booking Invoice Modal */}
                <EventBookingInvoiceModal
                    open={showEventInvoiceModal}
                    onClose={() => {
                        setShowEventInvoiceModal(false);
                        setSelectedBookingId(null);
                    }}
                    bookingId={selectedBookingId}
                    setBookings={setTransactionList}
                    financeView={true}
                />

                {/* Payment Dialog */}
                <PaymentDialog
                    open={paymentConfirmationOpen}
                    onClose={() => {
                        setPaymentConfirmationOpen(false);
                        setTransactionToPay(null);
                    }}
                    transaction={transactionToPay}
                    onConfirm={handleConfirmPayment}
                    submitting={submittingPayment}
                />

                {/* Bulk Discount Dialog */}
                <Dialog open={discountDialogOpen} onClose={() => setDiscountDialogOpen(false)}>
                    <DialogTitle>Apply Bulk Discount</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Apply a discount to {selectedIds.length} selected items. This will reduce the invoice amount.
                        </Typography>
                        <TextField autoFocus margin="dense" label="Discount Amount" type="number" fullWidth variant="outlined" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} />
                        <FormControlLabel control={<Switch checked={bulkIsPercent} onChange={(e) => setBulkIsPercent(e.target.checked)} />} label="Is Percentage (%)" />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleBulkSubmit('discount')} variant="contained" disabled={isSubmittingBulk}>
                            {isSubmittingBulk ? 'Applying...' : 'Apply'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Bulk Overdue Dialog */}
                <Dialog open={overdueDialogOpen} onClose={() => setOverdueDialogOpen(false)}>
                    <DialogTitle>Apply Bulk Overdue Charges</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" sx={{ mb: 2 }}>
                            Apply overdue charges to {selectedIds.length} selected items. This will increase the invoice amount.
                        </Typography>
                        <TextField autoFocus margin="dense" label="Overdue Amount" type="number" fullWidth variant="outlined" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} />
                        <FormControlLabel control={<Switch checked={bulkIsPercent} onChange={(e) => setBulkIsPercent(e.target.checked)} />} label="Is Percentage (%)" />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOverdueDialogOpen(false)}>Cancel</Button>
                        <Button onClick={() => handleBulkSubmit('overdue')} variant="contained" color="error" disabled={isSubmittingBulk}>
                            {isSubmittingBulk ? 'Applying...' : 'Apply'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
            {/* </div> */}
        </>
    );
};

export default Transaction;
