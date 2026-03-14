import React, { useState, useEffect } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Select, MenuItem, Autocomplete, Chip, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormHelperText, Pagination, InputAdornment, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, FormLabel, RadioGroup, Radio, FormControlLabel, Checkbox, IconButton, Divider, Tooltip, Accordion, AccordionSummary, AccordionDetails, ThemeProvider, createTheme, InputLabel } from '@mui/material';
import dayjs from 'dayjs';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { Person, Search, Save, Print, Receipt, Visibility, Payment, Cancel as CancelIcon, ExpandMore } from '@mui/icons-material';
import MembershipInvoiceSlip from '@/pages/App/Admin/Membership/Invoice';
import PaymentDialog from './PaymentDialog';
import InvoiceItemsGrid from './InvoiceItemsGrid';

export default function CreateTransaction({ subscriptionTypes = [], subscriptionCategories = [], preSelectedMember = null, allowedFeeTypes = null, membershipCharges = [], maintenanceCharges = [], subscriptionCharges = [], otherCharges = [], financialChargeTypes = [], ...props }) {
    // const [open, setOpen] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [memberTransactions, setMemberTransactions] = useState([]);
    const [membershipFeePaid, setMembershipFeePaid] = useState(false);
    const [ledgerBalance, setLedgerBalance] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [formErrors, setFormErrors] = useState({});
    const [dateValidation, setDateValidation] = useState({ isValid: true, message: '' });
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [createdInvoiceId, setCreatedInvoiceId] = useState(null);
    const [createdMemberId, setCreatedMemberId] = useState(null);
    const [paymentConfirmationOpen, setPaymentConfirmationOpen] = useState(false);
    const [transactionToPay, setTransactionToPay] = useState(null);
    const [paymentMode, setPaymentMode] = useState(false);
    const [activeInvoice, setActiveInvoice] = useState(null);

    // New State for Invoice Grid
    const [transactionTypes, setTransactionTypes] = useState([]);
    const createBlankInvoiceItem = () => ({
        id: Date.now(),
        fee_type: '',
        fee_type_name: '',
        description: '',
        qty: 1,
        amount: '',
        tax_percentage: '',
        overdue_percentage: 0,
        discount_type: 'fixed',
        discount_value: '',
        discount_amount: 0,
        additional_charges: '',
        extra_percentage: '',
        valid_from: null,
        valid_to: null,
        days: '',
        remarks: '',
        subscription_type_id: '',
        subscription_category_id: '',
        family_member_id: '',
        financial_charge_type_id: '',
        total: 0,
    });
    const [invoiceItems, setInvoiceItems] = useState([createBlankInvoiceItem()]);

    // Pagination and search states
    const [searchInvoice, setSearchInvoice] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(5);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [bookingType, setBookingType] = useState('0'); // 0: member, 2: corporate, guest-*: guest

    // Quarter Status State
    const [quarterStatus, setQuarterStatus] = useState({
        paidQuarters: [],
        nextAvailableQuarter: 1,
        currentYear: new Date().getFullYear(),
        partialQuarters: {},
    });

    const { data, setData, post, processing, errors, reset } = useForm({
        booking_type: 'member',
        member_id: '',
        corporate_member_id: '',
        customer_id: '',
        // Main items array
        items: [],
        // Invoice Header Details
        payment_frequency: 'monthly', // Can be specific to maintenance items, but kept for legacy compat if needed
        payment_method: null,
        amount: 0, // Total Amount
        remarks: '',
        credit_card_type: null,
        receipt_file: null,
    });

    // Initial Load for Deep Link Invoice
    useEffect(() => {
        if (props.invoice) {
            const invoice = props.invoice;
            // 1. Set Member
            const member = invoice.member || invoice.corporate_member || invoice.customer;
            if (member) {
                // Normalize info if needed
                setSelectedMember(member);
                if (member.ledger_balance !== undefined) {
                    setLedgerBalance(member.ledger_balance);
                }
                // setPreSelectedMember(member); // Locks the search - this is a prop, cannot be set directly
                // Set booking type for UI
                if (invoice.invoiceable_type === 'App\\Models\\CorporateMember') setBookingType('2');
                else if (invoice.invoiceable_type === 'App\\Models\\Customer')
                    setBookingType('guest'); // Simplify guest
                else setBookingType('0');
            }

            // 2. Trigger Payment Mode
            handlePayClick(invoice);
        }
    }, [props.invoice]);

    // Fetch Transaction Types
    useEffect(() => {
        axios
            .get(route('finance.transaction.types'))
            .then((res) => setTransactionTypes(res.data))
            .catch((err) => console.error('Failed to fetch transaction types', err));
    }, []);

    // Sync items to form data
    useEffect(() => {
        const total = invoiceItems.reduce((sum, item) => sum + (item.total || 0), 0);
        setData((prev) => ({
            ...prev,
            items: invoiceItems,
            amount: total,
        }));
    }, [invoiceItems]);

    // Handle pre-selected member
    useEffect(() => {
        if (preSelectedMember) {
            handleMemberSelect(preSelectedMember);
        }
    }, [preSelectedMember]);

    // Analyze Quarter Status Logic
    const analyzeQuarterStatus = (transactions, membershipDate) => {
        // If corporate or guest, we don't track quarterly status the same way
        if ((bookingType !== '0' && bookingType !== '2') || !membershipDate) {
            return {
                paidQuarters: [],
                nextAvailableQuarter: 1,
                currentYear: new Date().getFullYear(),
                isNewCycle: false,
                latestEndDate: null,
                partialQuarters: {},
            };
        }

        const membershipYear = new Date(membershipDate).getFullYear();
        const membershipMonth = new Date(membershipDate).getMonth(); // 0-based
        const currentYear = new Date().getFullYear();

        const maintenanceTransactions = transactions.filter((t) => (t.fee_type === 'maintenance_fee' || t.fee_type == 4) && t.status === 'paid');
        const sortedTransactions = [...maintenanceTransactions].sort((a, b) => new Date(b.valid_to) - new Date(a.valid_to));

        let paidQuarters = [];
        let latestEndDate = null;
        let showCompletedYear = false;
        let isFirstYear = true;
        let completedCycles = 0;

        if (sortedTransactions.length > 0) {
            const mostRecentTransaction = sortedTransactions[0];
            const mostRecentEnd = new Date(mostRecentTransaction.valid_to);
            // Check if we've moved past the first year (December 31st of membership year)
            const firstYearEnd = new Date(membershipYear, 11, 31); // Dec 31 of membership year
            isFirstYear = mostRecentEnd <= firstYearEnd;

            latestEndDate = mostRecentEnd.toISOString().split('T')[0];
        }

        const monthsInFirstYear = [];
        for (let month = membershipMonth + 1; month <= 11; month++) {
            monthsInFirstYear.push(month);
        }

        const paidMonthsInFirstYear = [];
        // Helper to track covered months
        const checkCoverage = (txStart, txEnd, yearToCheck) => {
            let currentDate = new Date(txStart.getFullYear(), txStart.getMonth(), 1);
            const endDate = new Date(txEnd.getFullYear(), txEnd.getMonth(), 1);
            const covered = [];

            while (currentDate <= endDate) {
                const month = currentDate.getMonth();
                const year = currentDate.getFullYear();
                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                const hasOverlap = txStart <= monthEnd && txEnd >= monthStart;

                if (hasOverlap && year === yearToCheck) {
                    covered.push(month);
                }
                currentDate.setMonth(currentDate.getMonth() + 1);
            }
            return covered;
        };

        sortedTransactions.forEach((transaction) => {
            const txStart = new Date(transaction.valid_from);
            const txEnd = new Date(transaction.valid_to);
            const covered = checkCoverage(txStart, txEnd, membershipYear);
            covered.forEach((m) => {
                if (monthsInFirstYear.includes(m) && !paidMonthsInFirstYear.includes(m)) paidMonthsInFirstYear.push(m);
            });
        });

        const allFirstYearMonthsPaid = paidMonthsInFirstYear.length >= monthsInFirstYear.length;
        let partialQuarters = {};

        if (isFirstYear && !allFirstYearMonthsPaid) {
            // First Year Logic
            paidMonthsInFirstYear.forEach((month) => {
                const quarter = Math.floor(month / 3) + 1;
                if (!paidQuarters.includes(quarter)) paidQuarters.push(quarter);
            });
        } else {
            // Subsequent Years Logic
            let analysisYear = currentYear;
            if (sortedTransactions.length > 0) {
                const latestPaymentEnd = new Date(sortedTransactions[0].valid_to);
                analysisYear = latestPaymentEnd.getFullYear();
                if (latestPaymentEnd.getMonth() === 11) {
                    showCompletedYear = true;
                    paidQuarters = [1, 2, 3, 4];
                }
            }

            if (!showCompletedYear) {
                // Determine paid months in analysis year
                const paidMonthsInYear = new Set();
                sortedTransactions.forEach((t) => {
                    const txStart = new Date(t.valid_from);
                    const txEnd = new Date(t.valid_to);
                    const covered = checkCoverage(txStart, txEnd, analysisYear);
                    covered.forEach((m) => paidMonthsInYear.add(`${analysisYear}-${m}`));
                });

                for (let quarter = 1; quarter <= 4; quarter++) {
                    const qStart = (quarter - 1) * 3;
                    const monthsInQ = [qStart, qStart + 1, qStart + 2];
                    const paidInQ = monthsInQ.filter((m) => paidMonthsInYear.has(`${analysisYear}-${m}`));

                    if (paidInQ.length === 3) {
                        paidQuarters.push(quarter);
                    } else if (paidInQ.length > 0) {
                        const unpaid = monthsInQ.filter((m) => !paidMonthsInYear.has(`${analysisYear}-${m}`));
                        partialQuarters[quarter] = {
                            paidMonths: paidInQ,
                            unpaidMonths: unpaid,
                            nextUnpaidMonth: Math.min(...unpaid),
                        };
                    }
                }
            }
        }

        paidQuarters.sort((a, b) => a - b);

        let nextQuarter = 1;
        let isNewCycle = false;

        if (isFirstYear) {
            if (paidMonthsInFirstYear.length >= monthsInFirstYear.length) {
                nextQuarter = 1;
                isNewCycle = true;
            } else {
                const nextMonth = monthsInFirstYear.find((m) => !paidMonthsInFirstYear.includes(m));
                nextQuarter = Math.floor((nextMonth || 0) / 3) + 1;
            }
        } else {
            const hasAllQuarters = [1, 2, 3, 4].every((q) => paidQuarters.includes(q));
            if (hasAllQuarters || showCompletedYear) {
                nextQuarter = 1;
                isNewCycle = true;
                if (!showCompletedYear) paidQuarters = [];
            } else {
                let foundPartial = false;
                for (let i = 1; i <= 4; i++) {
                    if (partialQuarters[i]) {
                        nextQuarter = i;
                        foundPartial = true;
                        break;
                    }
                }
                if (!foundPartial) {
                    for (let i = 1; i <= 4; i++) {
                        if (!paidQuarters.includes(i)) {
                            nextQuarter = i;
                            break;
                        }
                    }
                }
            }
        }

        return {
            paidQuarters,
            nextAvailableQuarter: nextQuarter,
            currentYear: currentYear,
            isNewCycle,
            latestEndDate,
            partialQuarters,
        };
    };

    const suggestMaintenancePeriod = (frequency, index = null) => {
        if (!selectedMember) return;
        const membershipDate = new Date(selectedMember.membership_date);
        const membershipYear = membershipDate.getFullYear();
        const membershipMonth = membershipDate.getMonth();
        const firstYearEnd = new Date(Date.UTC(membershipYear, 11, 31));
        const isFirstYear = !quarterStatus.latestEndDate || new Date(quarterStatus.latestEndDate) <= firstYearEnd;

        let startDate, endDate, amount;

        // ... (Logic from OldCreate.jsx simplified for brevity but functional) ...
        // Re-implementing core logic quickly
        let monthsToAdd = frequency === 'monthly' ? 1 : frequency === 'quarterly' ? 3 : frequency === 'half_yearly' ? 6 : 12;

        if (isFirstYear) {
            // Logic for first year
            if (quarterStatus.latestEndDate) {
                const lastEnd = new Date(quarterStatus.latestEndDate);
                startDate = new Date(Date.UTC(lastEnd.getUTCFullYear(), lastEnd.getUTCMonth() + 1, 1));
            } else {
                startDate = new Date(Date.UTC(membershipYear, membershipMonth + 1, 1));
            }
            // Cap at end of year
            endDate = new Date(startDate);
            endDate.setUTCMonth(startDate.getUTCMonth() + monthsToAdd);
            endDate.setUTCDate(0);
            if (endDate > firstYearEnd) endDate = new Date(firstYearEnd);
        } else {
            // Logic for subsequent years
            // Use partial quarters if available
            const currentPartial = quarterStatus.partialQuarters[quarterStatus.nextAvailableQuarter];
            if (currentPartial && frequency === 'quarterly') {
                monthsToAdd = currentPartial.unpaidMonths.length;
            }

            if (quarterStatus.latestEndDate) {
                const lastEnd = new Date(quarterStatus.latestEndDate);
                startDate = new Date(Date.UTC(lastEnd.getUTCFullYear(), lastEnd.getUTCMonth() + 1, 1));
            } else {
                startDate = new Date(Date.UTC(quarterStatus.currentYear, 0, 1));
            }

            endDate = new Date(startDate);
            endDate.setUTCMonth(startDate.getUTCMonth() + monthsToAdd);
            endDate.setUTCDate(0);
        }

        // Amount calculation
        const monthDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)); // approx
        // Better: use diff in months
        const exactMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth()) + 1;

        const monthlyFee = parseFloat(String(selectedMember.total_maintenance_fee || 0).replace(/,/g, ''));
        amount = monthlyFee * exactMonths;

        // Calculate Days
        const dStart = dayjs(startDate);
        const dEnd = dayjs(endDate);
        const daysCount = dEnd.diff(dStart, 'day') + 1;

        const dateFromFn = startDate.toISOString().split('T')[0];
        const dateToFn = endDate.toISOString().split('T')[0];

        if (index !== null && index >= 0) {
            // Update specific item
            setInvoiceItems((prev) => {
                const newItems = [...prev];
                newItems[index] = {
                    ...newItems[index],
                    // Preserve existing fee_type logic
                    description: `Maintenance Fee (${frequency})`,
                    qty: 1,
                    amount: amount,
                    valid_from: dateFromFn,
                    valid_to: dateToFn,
                    days: daysCount,
                    total: amount,
                };
                return newItems;
            });
        } else {
            // Set Invoice Items (Legacy/Fallback)
            const newItem = {
                id: Date.now(),
                fee_type: 'maintenance_fee',
                description: `Maintenance Fee (${frequency})`,
                qty: 1,
                amount: amount,
                tax_percentage: 0,
                overdue_percentage: 0,
                discount_type: 'fixed',
                discount_value: 0,
                additional_charges: 0,
                valid_from: dateFromFn,
                valid_to: dateToFn,
                days: daysCount,
                remarks: '',
                total: amount,
            };
            setInvoiceItems([newItem]);
        }

        enqueueSnackbar(`Set payment period to ${frequency} (${exactMonths} months)`, { variant: 'info' });
    };

    // Search members function
    const searchMembers = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);

        // Determine search type based on bookingType state
        let searchType = 'member';
        if (bookingType === '2') {
            searchType = 'corporate';
        } else if (bookingType.startsWith('guest')) {
            searchType = bookingType; // Pass exact guest type (e.g. guest-1) to backend
        }

        try {
            const response = await axios.get(route('finance.transaction.search'), {
                params: { query, type: searchType },
            });
            setSearchResults(response.data.members || []);
        } catch (error) {
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    const fetchMemberTransactions = async (memberId) => {
        setLoadingTransactions(true);
        try {
            const response = await axios.get(route('finance.transaction.member', memberId), {
                params: { type: bookingType },
            });
            // Only update member details if we are fetching for the currently selected member
            // This prevents overwriting if the user switched members quickly (though unlikely here)
            setSelectedMember(response.data.member);
            setMemberTransactions(response.data.transactions);
            setFilteredTransactions(response.data.transactions);
            setFilteredTransactions(response.data.transactions);
            setMembershipFeePaid(response.data.membership_fee_paid);
            setLedgerBalance(response.data.ledger_balance);

            setLedgerBalance(response.data.ledger_balance);

            // Analyze quarter payment status
            const quarterAnalysis = analyzeQuarterStatus(response.data.transactions, response.data.member.membership_date);
            setQuarterStatus(quarterAnalysis);

            return response.data;
        } catch (error) {
            console.log(error);
            enqueueSnackbar('Error loading member transactions', { variant: 'error' });
        } finally {
            setLoadingTransactions(false);
        }
    };

    const handleMemberSelect = async (member) => {
        setSelectedMember(member);

        if (bookingType === '2') {
            setData('corporate_member_id', member.id);
        } else if (bookingType.startsWith('guest')) {
            setData('customer_id', member.id);
        } else {
            setData('member_id', member.id);
        }

        // Fetch transactions for Regular (0) and Corporate (2) members
        if (bookingType === '0' || bookingType === '2') {
            await fetchMemberTransactions(member.id);
        } else {
            // Reset transactions for non-members as we might not need to show history or logic differs
            setMemberTransactions([]);
        }
        enqueueSnackbar(`Selected: ${member.full_name || member.name}`, { variant: 'info' });
    };

    // Search function for invoice numbers
    const handleSearchInvoice = (searchTerm) => {
        setSearchInvoice(searchTerm);
        setCurrentPage(1); // Reset to first page when searching

        if (!searchTerm.trim()) {
            setFilteredTransactions(memberTransactions);
        } else {
            const filtered = memberTransactions.filter((transaction) => transaction.invoice_no == searchTerm);
            setFilteredTransactions(filtered);
        }
    };

    // Pagination calculations
    const indexOfLastTransaction = currentPage * transactionsPerPage;
    const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
    const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
    const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

    const handlePageChange = (event, newPage) => {
        setCurrentPage(newPage);
    };

    const handleFeeTypeChange = (feeType) => {
        setData((prevData) => {
            const newData = {
                ...prevData,
                fee_type: feeType,
                amount: '',
                valid_from: '',
                valid_to: '',
                subscription_type_id: '',
                subscription_category_id: '',
                tax_percentage: '',
                overdue_percentage: '',
                remarks: '',
                additional_charges: '',
                discount_type: '',
                discount_value: '',
            };

            // Helper to parse amount (remove commas if present)
            const parseAmount = (val) => {
                if (!val) return 0;
                return parseFloat(String(val).replace(/,/g, ''));
            };

            // Update amount based on fee type and selected member
            const memberCategory = selectedMember?.member_category || selectedMember?.memberCategory;

            if (selectedMember) {
                if (feeType === 'membership_fee') {
                    // Use Member Specific Membership Fee Details from member table only (no fallback to category)
                    const specFee = parseAmount(selectedMember.membership_fee);

                    // Always use member's specific fee (even if 0)
                    newData.amount = specFee;
                    newData.additional_charges = parseAmount(selectedMember.additional_membership_charges) || '';

                    const discVal = parseAmount(selectedMember.membership_fee_discount);
                    if (discVal > 0) {
                        newData.discount_type = 'fixed';
                        newData.discount_value = discVal;
                    }

                    // Combine remarks
                    const remarks = [selectedMember.comment_box, selectedMember.membership_fee_additional_remarks, selectedMember.membership_fee_discount_remarks].filter(Boolean).join('; ');
                    newData.remarks = remarks;

                    // Auto-suggest 4 years validity for membership fee
                    const today = new Date();
                    const fourYearsLater = new Date(today.getFullYear() + 4, today.getMonth(), today.getDate());
                    newData.valid_from = today.toISOString().split('T')[0];
                    newData.valid_to = fourYearsLater.toISOString().split('T')[0];
                } else if (feeType === 'maintenance_fee') {
                    // For maintenance, we use the effective monthly rate (Total Maintenance Fee) if available,
                    // otherwise the category fee. The calculation happens in suggestMaintenancePeriod.
                    // We trigger it here.

                    // We only populate remarks here as suggestMaintenancePeriod handles amount/dates
                    // We only populate remarks here as suggestMaintenancePeriod handles amount/dates
                    const maintRemarks = [selectedMember.comment_box, selectedMember.maintenance_fee_additional_remarks, selectedMember.maintenance_fee_discount_remarks].filter(Boolean).join('; ');
                    newData.remarks = maintRemarks;
                } else if (feeType === 'subscription_fee') {
                    // For subscription fees, reset amount
                    newData.amount = '';
                } else if (feeType === 'reinstating_fee') {
                    // For reinstating fees, set a standard amount (can be customized)
                    newData.amount = 25000; // Standard reinstating fee amount
                    newData.valid_from = '';
                    newData.valid_to = '';
                }
            }
            return newData;
        });
    };

    const handleBookingTypeChange = (e) => {
        const type = e.target.value;
        setBookingType(type);
        setSelectedMember(null);
        setSearchResults([]);
        setMemberTransactions([]);
        setInvoiceItems([createBlankInvoiceItem()]);

        // Map UI values to Backend types
        // 0 -> member
        // 2 -> corporate
        // guest-1, guest-2, guest-3 -> guest
        let backendType = 'member';
        if (type === '2') {
            backendType = 'corporate';
        } else if (type.startsWith('guest')) {
            backendType = 'guest'; // Keep it generic 'guest' for now, or specific if backend supports it.
        }

        setData((prev) => ({
            ...prev,
            booking_type: backendType,
            member_id: '',
            corporate_member_id: '',
            customer_id: '',
            fee_type: '', // Reset fee type
        }));
    };

    // Use axios to fetch guest types
    const [guestTypes, setGuestTypes] = useState([]);

    useEffect(() => {
        const fetchGuestTypes = async () => {
            try {
                const response = await axios.get(route('api.guest-types.active'));
                setGuestTypes(response.data);
            } catch (error) {
                console.error('Error fetching guest types:', error);
            }
        };
        fetchGuestTypes();
    }, []);

    const calculateBreakdown = () => {
        const amount = parseFloat(data.amount) || 0;
        const discountValue = parseFloat(data.discount_value) || 0;
        const additionalCharges = parseFloat(data.additional_charges) || 0;

        let discountAmount = 0;
        let netAmount = amount;

        if (data.discount_type === 'percent') {
            discountAmount = (amount * discountValue) / 100;
            netAmount = amount - discountAmount;
        } else if (data.discount_type === 'fixed') {
            discountAmount = discountValue;
            netAmount = amount - discountAmount;
        }

        const taxPercentage = parseFloat(data.tax_percentage) || 0;
        const overduePercentage = parseFloat(data.overdue_percentage) || 0;

        const taxAmount = (netAmount * taxPercentage) / 100;
        const overdueAmount = (netAmount * overduePercentage) / 100;

        const totalAmount = Math.round(netAmount + taxAmount + overdueAmount + additionalCharges);

        return {
            grossAmount: amount,
            discountAmount,
            netAmount,
            taxAmount,
            overdueAmount,
            additionalCharges,
            totalAmount,
        };
    };

    const calculateTotal = () => {
        if (!invoiceItems || invoiceItems.length === 0) return 0;

        return invoiceItems.reduce((sum, item) => {
            const amount = parseFloat(item.amount) || 0;
            // If items manage their own tax/discount, enable this logic:
            // const tax = parseFloat(item.tax) || 0;
            // const discount = parseFloat(item.discount_val) || 0;
            // let itemTotal = amount;
            // if (item.discount_type === 'percent') itemTotal -= (amount * discount / 100);
            // else itemTotal -= discount;
            // itemTotal += (itemTotal * tax / 100);
            // return sum + itemTotal;

            // For now, as per Grid logic, let's assume 'amount' is the base.
            // If the user wants full calc, we can duplicate Grid logic or just sum amounts.
            // The InvoiceItemsGrid usually updates a 'total' field if implemented, or we recalc here.
            // Let's implement a safe recalculation:

            let net = amount;
            const discountVal = parseFloat(item.discount_val) || 0;
            const taxPct = parseFloat(item.tax) || 0;
            const addChg = parseFloat(item.add_charges) || 0;

            if (item.discount_type === 'percent') {
                net -= (amount * discountVal) / 100;
            } else {
                net -= discountVal;
            }

            const taxAmt = (net * taxPct) / 100;
            const itemTotal = net + taxAmt + addChg;

            return sum + (itemTotal > 0 ? itemTotal : 0);
        }, 0);
    };

    const validateDateOverlap = () => {
        if (!data.valid_from || !data.valid_to || !selectedMember || data.fee_type !== 'maintenance_fee') {
            return { isValid: true };
        }

        const newStart = new Date(data.valid_from);
        const newEnd = new Date(data.valid_to);

        // Get maintenance fee transactions and find the most recent active period
        const maintenanceTransactions = memberTransactions.filter((t) => (t.fee_type === 'maintenance_fee' || t.fee_type == 4) && t.status === 'paid' && t.valid_from && t.valid_to);

        // Sort by end date (latest first) to get the most recent transaction
        const sortedTransactions = [...maintenanceTransactions].sort((a, b) => new Date(b.valid_to) - new Date(a.valid_to));

        // Only check overlap with the most recent transaction (current active period)
        if (sortedTransactions.length > 0) {
            const mostRecentTransaction = sortedTransactions[0];
            const existingStart = new Date(mostRecentTransaction.valid_from);
            const existingEnd = new Date(mostRecentTransaction.valid_to);

            // Check if dates overlap with the current active period
            const hasOverlap = newStart <= existingEnd && newEnd >= existingStart;

            if (hasOverlap) {
                return {
                    isValid: false,
                    message: `Selected period (${formatDate(newStart)} to ${formatDate(newEnd)}) overlaps with current payment period (${formatDate(existingStart)} to ${formatDate(existingEnd)})`,
                };
            }
        }
        return { isValid: true };
    };

    // Helper function to get first day of month from date
    const getFirstDayOfMonth = (dateString) => {
        if (!dateString) return '';
        // Extract year and month from the date string
        const [year, month] = dateString.split('-');
        // Return first day of the same month
        return `${year}-${month}-01`;
    };

    // Helper function to get last day of month from date
    const getLastDayOfMonth = (dateString) => {
        if (!dateString) return '';
        // Extract year and month from the date string
        const [year, month] = dateString.split('-');
        // Create a date object for the first day of next month, then subtract 1 day
        const nextMonth = new Date(parseInt(year), parseInt(month), 1); // This gives us first day of next month
        const lastDay = new Date(nextMonth - 1); // Subtract 1 day to get last day of current month

        // Format as YYYY-MM-DD
        const lastDayFormatted = lastDay.toISOString().split('T')[0];
        return lastDayFormatted;
    };

    // Real-time validation when dates change
    const handleDateChange = (field, dateValue) => {
        let value = dateValue ? dayjs(dateValue).format('YYYY-MM-DD') : '';

        // For maintenance fees, enforce month boundaries
        if (data.fee_type === 'maintenance_fee' && value) {
            if (field === 'valid_from') {
                // Always set to first day of selected month
                const correctedValue = getFirstDayOfMonth(value);
                value = correctedValue;
            } else if (field === 'valid_to') {
                // Always set to last day of selected month
                const correctedValue = getLastDayOfMonth(value);
                value = correctedValue;
            }
        }

        setData(field, value);

        // Recalculate amount if both dates are present
        const currentFromDate = field === 'valid_from' ? value : data.valid_from;
        const currentToDate = field === 'valid_to' ? value : data.valid_to;

        if (selectedMember && currentFromDate && currentToDate) {
            const fromDate = new Date(currentFromDate);
            const toDate = new Date(currentToDate);

            if (fromDate && toDate && toDate >= fromDate) {
                if (data.fee_type === 'maintenance_fee') {
                    // Calculate number of months between dates for maintenance fee
                    const monthsDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()) + 1;

                    // Calculate amount based on monthly fee from member table only (no category fallback)
                    const parseAmount = (val) => parseFloat(String(val || 0).replace(/,/g, ''));
                    let monthlyFee = parseAmount(selectedMember.total_maintenance_fee);

                    const newAmount = monthlyFee * monthsDiff;

                    setData('amount', newAmount);

                    enqueueSnackbar(`Amount updated to Rs ${newAmount.toLocaleString()} for ${monthsDiff} months`, {
                        variant: 'info',
                    });
                } else if (data.fee_type === 'subscription_fee' && data.subscription_category_id) {
                    // Calculate amount for subscription fee based on selected category and date range
                    const selectedCategory = subscriptionCategories?.find((cat) => cat.id == data.subscription_category_id);

                    if (selectedCategory) {
                        let newAmount;
                        let periodText;

                        // Calculate total days between dates
                        const totalDays = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                        // Check if it's full months or partial days
                        const isFullMonths = fromDate.getDate() === 1 && toDate.getDate() === new Date(toDate.getFullYear(), toDate.getMonth() + 1, 0).getDate();

                        if (isFullMonths) {
                            // Full months calculation
                            const monthsDiff = (toDate.getFullYear() - fromDate.getFullYear()) * 12 + (toDate.getMonth() - fromDate.getMonth()) + 1;
                            newAmount = Math.round(selectedCategory.fee * monthsDiff);
                            periodText = `${monthsDiff} month${monthsDiff > 1 ? 's' : ''} (${totalDays} days)`;
                        } else {
                            // Daily calculation - use average month (30 days) for consistency
                            const dailyRate = Math.round(selectedCategory.fee / 30);
                            newAmount = dailyRate * totalDays;
                            periodText = `${totalDays} day${totalDays > 1 ? 's' : ''} (Rs ${dailyRate}/day)`;
                        }

                        setData('amount', newAmount);

                        enqueueSnackbar(`Amount updated to Rs ${newAmount.toLocaleString()} for ${periodText}`, {
                            variant: 'info',
                        });
                    }
                }
            }
        }
    };

    const handleSubmit = (e, status = 'unpaid', print = false) => {
        e.preventDefault();

        // Validate items
        if (invoiceItems.length === 0) {
            enqueueSnackbar('Please add at least one item to the invoice', { variant: 'error' });
            return;
        }

        // Validate payment amounts in Payment Mode
        if (paymentMode) {
            const hasInvalidAmount = invoiceItems.some((item) => {
                const amount = parseFloat(item.payment_amount || 0);
                const balance = parseFloat(item.balance || 0);
                return amount < 0 || amount > balance; // Allow 0, but maybe warn?
            });
            // Actually, backend handles validation, but basic check is good.
        }

        if (status === 'paid') {
            const tempTransaction = {
                isNew: true,
                invoice_no: 'NEW',
                amount: data.amount,
                fee_type: data.fee_type || (invoiceItems.length > 0 ? invoiceItems[0].fee_type : 'Invoice'),
                member: selectedMember,
            };
            setTransactionToPay(tempTransaction);
            setPaymentConfirmationOpen(true);
            return;
        }

        processSubmit(status, null, print);
    };

    const processSubmit = async (targetStatus, paymentDetails, shouldPrint = false) => {
        setSubmitting(true);
        console.log('--- processSubmit Started ---');
        console.log('Booking Type:', bookingType);
        console.log('Selected Member:', selectedMember);
        console.log('Target Status:', targetStatus);
        console.log('Payment Details:', paymentDetails);

        try {
            // Create FormData for file upload
            const formData = new FormData();

            // Add common fields
            // Use data.booking_type as it is already normalized to 'member', 'corporate', 'guest'
            const normalizedBookingType = data.booking_type;
            formData.append('booking_type', normalizedBookingType);

            // Handle member IDs based on mapped booking type
            // Ensure selectedMember exists before accessing ID
            if (!selectedMember) {
                console.error('No member selected!');
                enqueueSnackbar('No member selected!', { variant: 'error' });
                setSubmitting(false);
                return;
            }

            if (normalizedBookingType === 'member') {
                formData.append('member_id', selectedMember.id);
            } else if (normalizedBookingType === 'corporate') {
                formData.append('corporate_member_id', selectedMember.id);
            } else if (normalizedBookingType === 'guest') {
                // For generic guest, or specific guest types masked as 'guest'
                formData.append('customer_id', selectedMember.id);
            }

            // Determine Action string for backend validation
            let action = 'save';
            if (paymentMode && activeInvoice) {
                action = 'pay_existing_invoice';
                formData.append('invoice_id', activeInvoice.id);
            } else if (targetStatus === 'paid') {
                action = 'save_receive';
            } else if (shouldPrint) {
                action = 'save_print';
            }
            formData.append('action', action);
            console.log('Action determined:', action);

            formData.append('status', targetStatus);
            if (data.remarks) formData.append('remarks', data.remarks);

            // Payment Details
            if (targetStatus === 'paid' && paymentDetails) {
                formData.append('payment_method', paymentDetails.payment_method);

                // Common optional fields
                if (paymentDetails.payment_mode_details) {
                    formData.append('payment_mode_details', paymentDetails.payment_mode_details);
                }

                if (paymentDetails.payment_account_id) {
                    formData.append('payment_account_id', paymentDetails.payment_account_id);
                }

                if (paymentDetails.payment_method === 'credit_card' || paymentDetails.payment_method === 'debit_card') {
                    formData.append('credit_card_type', paymentDetails.credit_card_type);
                }

                // Allow receipt file for all applicable methods
                if (paymentDetails.receipt_file) formData.append('receipt_file', paymentDetails.receipt_file);
            }

            // Append Items
            invoiceItems.forEach((item, index) => {
                Object.keys(item).forEach((key) => {
                    const value = item[key];
                    if (value !== null && value !== undefined) {
                        // Format dates if they are Date objects or dayjs objects
                        if ((key === 'valid_from' || key === 'valid_to') && value) {
                            try {
                                // check if it's already a string in YYYY-MM-DD
                                if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                    formData.append(`items[${index}][${key}]`, value);
                                } else {
                                    formData.append(`items[${index}][${key}]`, dayjs(value).format('YYYY-MM-DD'));
                                }
                            } catch (e) {
                                formData.append(`items[${index}][${key}]`, value);
                            }
                        } else {
                            formData.append(`items[${index}][${key}]`, value);
                        }
                    }
                });
            });

            // Log FormData keys
            for (var pair of formData.entries()) {
                console.log(pair[0] + ', ' + pair[1]);
            }

            const response = await axios.post(route('finance.transaction.store'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                // Set invoice details for modal
                const transactionData = response.data.transaction || response.data.invoice;
                if (transactionData) {
                    setCreatedInvoiceId(transactionData.id);
                    // Use invoice_no as memberId placeholder if that's what the modal expects, or actual member ID
                    // Looking at Invoice Modal usage: invoiceNo={createdMemberId} invoiceId={createdInvoiceId}
                    // It seems legacy used invoice_no? Let's pass invoice_no as safe fallback
                    setCreatedMemberId(transactionData.invoice_no);

                    if (shouldPrint || targetStatus === 'paid') {
                        // For Save & Print, we want to open the modal AND ideally auto-trigger print inside it
                        // Or just opening the modal allows the user to click Print.
                        // User request: "it save but not open print invoice"
                        setShowInvoiceModal(true);
                    }
                }

                enqueueSnackbar('Transaction saved successfully', { variant: 'success' });

                setSubmitting(false);

                // If coming from deep link (invoice prop), go back
                if (props.invoice) {
                    const referrer = document.referrer || '';
                    if (referrer && referrer.includes('/admin/finance/manage')) {
                        const url = new URL(referrer);
                        const params = Object.fromEntries(url.searchParams.entries());
                        router.visit(route('finance.transaction', params), {
                            replace: true,
                            preserveState: false,
                        });
                    } else {
                        router.visit(route('finance.transaction'), { replace: true, preserveState: false });
                    }
                    return;
                }

                resetToNewTransaction();

                // Show success message
                enqueueSnackbar(`Transaction created successfully (${targetStatus})!`, { variant: 'success' });
            }
        } catch (error) {
            if (error.response && error.response.status === 422) {
                // Validation errors
                const errors = error.response.data.errors || {};
                setFormErrors(errors);

                // Show specific error messages in snackbar
                const errorMessages = Object.values(errors).flat();
                if (errorMessages.length > 0) {
                    errorMessages.forEach((msg) => {
                        enqueueSnackbar(msg, { variant: 'error' });
                    });
                } else {
                    enqueueSnackbar('Please check the form for validation errors.', { variant: 'error' });
                }
            } else if (error.response && error.response.data.error) {
                // Business logic errors
                enqueueSnackbar(error.response.data.error, { variant: 'error' });
            } else {
                // Other errors
                enqueueSnackbar('Failed to create transaction. Please try again.', { variant: 'error' });
                console.error(error);
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Helper function to format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        })
            .format(Math.round(amount))
            .replace('PKR', 'Rs ');
    };

    // Helper function to format status
    const formatStatus = (status) => {
        if (!status) return '';
        return status
            .replace(/[_-]/g, ' ') // Remove underscores and hyphens
            .split(' ')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
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

    const getStatusStyle = (status) => statusStyles[status] || statusStyles.default;

    const statusStyles = {
        paid: { bg: '#d4edda', color: '#155724' },
        unpaid: { bg: '#f8d7da', color: '#721c24' },
        default: { bg: '#e2e3e5', color: '#383d41' },
    };

    const toTitleCase = (str = '') => str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

    // Payment Confirmation Handlers
    const [submittingPayment, setSubmittingPayment] = useState(false);

    const handlePayClick = (transaction) => {
        // Activate Payment Mode
        setPaymentMode(true);
        setActiveInvoice(transaction);

        // Populate items with balance info
        const parsedItems = (transaction.items || []).map((item) => {
            const total = parseFloat(String(item.total || 0).replace(/,/g, ''));
            const paid = parseFloat(String(item.paid_amount || 0).replace(/,/g, ''));
            return {
                ...item,
                transaction_type_id: item.fee_type,
                total: total,
                amount: parseFloat(String(item.amount || 0).replace(/,/g, '')),
                payment_amount: '',
                balance: Math.max(0, total - paid),
                paid_amount: paid,
                valid_from: item.valid_from || item.start_date,
                valid_to: item.valid_to || item.end_date,
            };
        });

        const invoiceTotal = parseFloat(String(transaction.total_price || 0).replace(/,/g, ''));
        const itemsBaseTotal = parsedItems.reduce((sum, it) => sum + (parseFloat(it.total || 0) || 0), 0);
        const delta = invoiceTotal - itemsBaseTotal;

        let itemsToPay = parsedItems;
        if (Number.isFinite(invoiceTotal) && parsedItems.length > 0 && Math.abs(delta) >= 1) {
            let remaining = delta;
            itemsToPay = parsedItems.map((it, idx) => {
                const base = parseFloat(it.total || 0) || 0;
                let share = 0;
                if (parsedItems.length === 1) {
                    share = remaining;
                } else if (itemsBaseTotal > 0) {
                    share = Math.round((delta * base) / itemsBaseTotal);
                }
                if (idx === parsedItems.length - 1) {
                    share = remaining;
                } else {
                    remaining -= share;
                }
                const adjustedTotal = Math.round(base + share);
                const adjustedBalance = Math.max(0, adjustedTotal - (parseFloat(it.paid_amount || 0) || 0));
                return {
                    ...it,
                    total: adjustedTotal,
                    balance: adjustedBalance,
                };
            });
        }
        setInvoiceItems(itemsToPay);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        reset();
        setInvoiceItems([createBlankInvoiceItem()]);
        setFormErrors({});
        setSearchResults([]);
        if (!preSelectedMember) {
            setSelectedMember(null);
            setMemberTransactions([]);
        }
    };

    const resetToNewTransaction = () => {
        const normalizedBookingType = bookingType === '2' ? 'corporate' : String(bookingType).startsWith('guest') ? 'guest' : 'member';

        reset();
        setData({
            booking_type: normalizedBookingType,
            member_id: '',
            corporate_member_id: '',
            customer_id: '',
            items: [],
            payment_frequency: 'monthly',
            payment_method: null,
            amount: 0,
            remarks: '',
            credit_card_type: null,
            receipt_file: null,
        });

        setSelectedMember(null);
        setMemberTransactions([]);
        setFilteredTransactions([]);
        setMembershipFeePaid(false);
        setLedgerBalance(null);
        setSearchResults([]);
        setSearchInvoice('');
        setCurrentPage(1);
        setQuarterStatus({
            paidQuarters: [],
            nextAvailableQuarter: 1,
            currentYear: new Date().getFullYear(),
            partialQuarters: {},
        });
        setFormErrors({});

        setPaymentMode(false);
        setActiveInvoice(null);
        setTransactionToPay(null);
        setPaymentConfirmationOpen(false);
        setInvoiceItems([createBlankInvoiceItem()]);
    };

    const handleCancelPaymentMode = () => {
        if (props.invoice) {
            window.history.back();
            return;
        }
        setPaymentMode(false);
        setActiveInvoice(null);
        setInvoiceItems([createBlankInvoiceItem()]);
        resetForm();
    };

    const handleConfirmPayment = async (paymentData) => {
        if (!transactionToPay) return;

        // NEW: Check if this is a newly created transaction that needs submission
        if (transactionToPay.isNew) {
            setPaymentConfirmationOpen(false);
            setTransactionToPay(null);
            // Submit the full form with payment details
            await processSubmit('paid', paymentData);
            return;
        }

        setSubmittingPayment(true);
        const formData = new FormData();
        formData.append('status', 'paid');
        formData.append('payment_method', paymentData.payment_method);

        if (paymentData.payment_mode_details) {
            formData.append('payment_mode_details', paymentData.payment_mode_details);
        }

        if (paymentData.payment_account_id) {
            formData.append('payment_account_id', paymentData.payment_account_id);
        }

        if (paymentData.payment_method === 'credit_card' || paymentData.payment_method === 'debit_card') {
            formData.append('credit_card_type', paymentData.credit_card_type);
        }

        if (paymentData.receipt_file) {
            formData.append('receipt_file', paymentData.receipt_file);
        }

        try {
            const response = await axios.post(route('finance.transaction.update-status', transactionToPay.id), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            if (response.data.success) {
                enqueueSnackbar('Invoice marked as paid successfully!', { variant: 'success' });
                // Refresh transactions
                fetchMemberTransactions(selectedMember.id);
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

    // Cancellation Logic
    const [cancellationOpen, setCancellationOpen] = useState(false);
    const [transactionToCancel, setTransactionToCancel] = useState(null);
    const [cancellationReason, setCancellationReason] = useState('');
    const [cancelling, setCancelling] = useState(false);

    const handleCancelClick = (transaction) => {
        setTransactionToCancel(transaction);
        setCancellationReason('');
        setCancellationOpen(true);
    };

    const handleConfirmCancellation = async () => {
        if (!transactionToCancel) return;
        if (!cancellationReason.trim()) {
            enqueueSnackbar('Please provide a reason for cancellation.', { variant: 'error' });
            return;
        }

        setCancelling(true);
        const formData = new FormData();
        formData.append('status', 'cancelled');
        formData.append('cancellation_reason', cancellationReason);

        try {
            const response = await axios.post(route('finance.transaction.update-status', transactionToCancel.id), formData);
            if (response.data.success) {
                enqueueSnackbar('Invoice cancelled successfully.', { variant: 'success' });
                // Refresh transactions
                fetchMemberTransactions(selectedMember.id);
                setCancellationOpen(false);
                setTransactionToCancel(null);
            }
        } catch (error) {
            console.error('Error cancelling invoice:', error);
            enqueueSnackbar(error.response?.data?.errors ? Object.values(error.response.data.errors).flat().join(', ') : 'Failed to cancel invoice', { variant: 'error' });
        } finally {
            setCancelling(false);
        }
    };

    return (
        <>
            <Box sx={{ p: 2 }}>
                {/* Header */}
                <Box sx={{ mb: 2 }}>
                    <Typography sx={{ fontWeight: 700, color: '#063455', fontSize: '30px' }}>Invoice Generation</Typography>
                    <Typography sx={{ color: '#063455', fontWeight: '600', fontSize: '15px' }}>Search for a member and create a new transaction</Typography>
                </Box>

                <Grid container spacing={2}>
                    {/* Step 1: Member Search */}
                    <Grid item xs={12}>
                        <Card sx={{ mb: 2, boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Box
                                        sx={{
                                            bgcolor: '#063455',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: 24,
                                            height: 24,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mr: 1.5,
                                            fontSize: '12px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        1
                                    </Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455' }}>Booking Type</Typography>
                                </Box>
                                <Grid item xs={12} mb={1}>
                                    <RadioGroup row name="bookingType" value={bookingType} onChange={handleBookingTypeChange} disabled={paymentMode || !!preSelectedMember}>
                                        <FormControlLabel value="0" control={<Radio />} label="Member" disabled={paymentMode || !!preSelectedMember} />
                                        <FormControlLabel value="2" control={<Radio />} label="Corporate Member" disabled={paymentMode || !!preSelectedMember} />
                                        {guestTypes.map((type) => (
                                            <FormControlLabel key={type.id} value={`guest-${type.id}`} control={<Radio />} label={type.name} disabled={paymentMode || !!preSelectedMember} />
                                        ))}
                                    </RadioGroup>
                                </Grid>

                                <Autocomplete
                                    key={bookingType}
                                    size="small"
                                    disabled={paymentMode || !!preSelectedMember}
                                    value={selectedMember}
                                    isOptionEqualToValue={(option, value) => option.id === value.id}
                                    options={searchResults}
                                    getOptionLabel={(option) => `${option.full_name} (${option.membership_no})`}
                                    loading={searchLoading}
                                    onInputChange={(event, value) => {
                                        searchMembers(value);
                                    }}
                                    onChange={(event, value) => {
                                        if (value) handleMemberSelect(value);
                                    }}
                                    renderInput={(params) => (
                                        <TextField
                                            size="small"
                                            {...params}
                                            label="Search by name, membership no, CNIC, or phone"
                                            variant="outlined"
                                            fullWidth
                                            sx={{ mb: 2 }}
                                            InputProps={{
                                                ...params.InputProps,
                                                startAdornment: <Search sx={{ mr: 1, color: 'action.active' }} />,
                                                endAdornment: (
                                                    <>
                                                        {searchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                    renderOption={(props, option) => (
                                        <li {...props} key={option.id}>
                                            <Box sx={{ width: '100%' }}>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="body2" fontWeight="bold">
                                                        {option.membership_no || option.customer_no || option.employee_id}
                                                    </Typography>
                                                    {option.status && <Chip label={option.status} size="small" color={option.status === 'active' ? 'success' : option.status === 'expired' ? 'warning' : 'error'} sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }} />}
                                                </Box>
                                                <Typography variant="body2">{option.full_name || option.name}</Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.cnic_no || option.cnic} • {option.mobile_number_a || option.contact}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                                {selectedMember && (
                                    <Box sx={{ mt: 1, p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid', borderColor: '#e2e8f0' }}>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
                                            {/* Member Info */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box
                                                    sx={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        border: '1px solid #063455',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        backgroundColor: 'transparent', // or '#063455' if you want
                                                    }}
                                                >
                                                    <Person sx={{ fontSize: 18, color: '#063455' }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ color: '#1e293b', fontWeight: 700, fontSize: '14px', mb: -1 }}>{selectedMember.full_name} </Typography>
                                                    <Typography component="span" variant="caption" color="text.secondary">
                                                        ({selectedMember.membership_no || 'No #'})
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        {formatStatus(selectedMember.status)} • {selectedMember.cnic_no || selectedMember.cnic || 'No CNIC'}
                                                    </Typography>
                                                </Box>
                                            </Box>

                                            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 38, alignSelf: 'center', fontWeight: 'bold', bgcolor: '#063455' }} />

                                            {/* Fees Summary Strip */}
                                            <Box sx={{ display: 'flex', gap: 5, flexGrow: 1, flexWrap: 'wrap' }}>
                                                <Box>
                                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#7f7f7f' }}>Membership Fee</Typography>
                                                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '14px' }}>{(parseFloat(String(selectedMember.membership_fee || 0).replace(/,/g, '')) || 0) > 0 ? `Rs ${(parseFloat(String(selectedMember.membership_fee || 0).replace(/,/g, '')) || 0).toLocaleString()}` : '-'}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#7f7f7f' }}>Monthly Fee</Typography>
                                                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '14px' }}>Rs {(parseFloat(String(selectedMember.total_maintenance_fee || 0).replace(/,/g, '')) || 0).toLocaleString()}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#7f7f7f' }}>Quarterly Fee</Typography>
                                                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '14px' }}>Rs {(parseFloat(String(selectedMember.total_maintenance_fee || 0).replace(/,/g, '')) * 3 || 0).toLocaleString()}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#7f7f7f' }}>Joined Date</Typography>
                                                    <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '14px' }}>{formatDate(selectedMember.membership_date)}</Typography>
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontWeight: '600', fontSize: '14px', color: '#7f7f7f' }}>Ledger Balance</Typography>
                                                    <Box display="flex" alignItems="center">
                                                        <Typography sx={{ color: '#063455', fontWeight: 700, fontSize: '14px' }}>{formatCurrency(Math.max(0, ledgerBalance || 0))}</Typography>
                                                        {/* <IconButton
                                                            size="small"
                                                            onClick={() => {
                                                                const historySection = document.getElementById('transaction-history-section');
                                                                if (historySection) historySection.scrollIntoView({ behavior: 'smooth' });
                                                            }}
                                                            sx={{ ml: 5, p: 0 }}
                                                        >
                                                            <Visibility fontSize="small" />
                                                        </IconButton> */}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                    {/* Step 2: Transaction Form and Member Details */}
                    <Grid item xs={12}>
                        <Grid container spacing={3}>
                            {/* Left Column: Transaction Form */}
                            <Grid item xs={12}>
                                <Card sx={{ mb: 2, boxShadow: '0 2px 4px -1px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Box
                                                sx={{
                                                    bgcolor: selectedMember ? '#063455' : 'grey.300',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: 24,
                                                    height: 24,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 1.5,
                                                    fontSize: '12px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                2
                                            </Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455' }}>Transaction Details</Typography>
                                        </Box>
                                        {selectedMember ? (
                                            <form onSubmit={(e) => handleSubmit(e)}>
                                                <Grid container spacing={3}>
                                                    {/* Maintenance Status Accordion */}
                                                    {selectedMember && (bookingType === '0' || bookingType === '2') && (
                                                        <Grid item xs={12}>
                                                            <Accordion sx={{ background: '#f8fafc', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                                                                <AccordionSummary expandIcon={<ExpandMore />}>
                                                                    <Typography sx={{ fontWeight: 600, color: '#0f172a' }}>Quarter Payment Status</Typography>
                                                                </AccordionSummary>
                                                                <AccordionDetails>
                                                                    <Box sx={{ mb: 2 }}>
                                                                        {(() => {
                                                                            const membershipDate = new Date(selectedMember.membership_date);
                                                                            const membershipYear = membershipDate.getFullYear();
                                                                            const firstYearEnd = new Date(membershipYear, 11, 31);
                                                                            const isFirstYear = (!quarterStatus.latestEndDate || new Date(quarterStatus.latestEndDate) <= firstYearEnd) && membershipDate.getMonth() < 11;

                                                                            return (
                                                                                <>
                                                                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                                                                                        {isFirstYear ? 'First Year (Monthly Payment)' : 'Quarterly Payment System'}
                                                                                    </Typography>

                                                                                    {!isFirstYear && (
                                                                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                                                            {[1, 2, 3, 4].map((quarter) => (
                                                                                                <Chip key={quarter} label={`Q${quarter}`} color={quarterStatus.paidQuarters.includes(quarter) ? 'success' : 'default'} variant={quarterStatus.paidQuarters.includes(quarter) ? 'filled' : 'outlined'} size="medium" sx={{ minWidth: 50, fontWeight: 600 }} />
                                                                                            ))}
                                                                                        </Box>
                                                                                    )}

                                                                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                                        <strong>Next payment:</strong> {isFirstYear ? 'Monthly payment' : `Q${quarterStatus.nextAvailableQuarter}`}
                                                                                        {quarterStatus.latestEndDate && <span> (Last paid until: {formatDate(quarterStatus.latestEndDate)})</span>}
                                                                                        {!quarterStatus.latestEndDate && <span> (No maintenance history)</span>}
                                                                                    </Typography>
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </Box>
                                                                </AccordionDetails>
                                                            </Accordion>
                                                        </Grid>
                                                    )}

                                                    {/* Invoice Items Grid */}
                                                    <Grid item xs={12}>
                                                        <InvoiceItemsGrid items={invoiceItems} setItems={setInvoiceItems} transactionTypes={transactionTypes} selectedMember={selectedMember} subscriptionCategories={subscriptionCategories} onQuickSelectMaintenance={suggestMaintenancePeriod} membershipCharges={membershipCharges} maintenanceCharges={maintenanceCharges} subscriptionCharges={subscriptionCharges} otherCharges={otherCharges} financialChargeTypes={financialChargeTypes} bookingType={bookingType} paymentMode={paymentMode} invoice={activeInvoice} />
                                                    </Grid>

                                                    {/* Remarks Section */}
                                                    <Grid item xs={12}>
                                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: '#063455' }}>
                                                            Remarks
                                                        </Typography>
                                                        <TextField
                                                            size="small"
                                                            fullWidth
                                                            label="Comments / Remarks"
                                                            multiline
                                                            rows={3}
                                                            value={data.remarks}
                                                            onChange={(e) => setData('remarks', e.target.value)}
                                                            placeholder="Enter any additional notes or comments here..."
                                                            sx={{
                                                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                                            }}
                                                        />
                                                    </Grid>



                                                    {/* Action Buttons */}
                                                    <Grid item xs={12}>
                                                        <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
                                                            {paymentMode && (
                                                                <Button onClick={handleCancelPaymentMode} variant="text" size="large" color="error" sx={{ mr: 'auto' }}>
                                                                    {props.invoice ? 'Back' : 'Cancel Payment Mode'}
                                                                </Button>
                                                            )}
                                                            {!paymentMode && (
                                                                <>
                                                                    <Button
                                                                        onClick={(e) => handleSubmit(e, 'unpaid', false)}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        disabled={submitting || invoiceItems.length === 0}
                                                                        sx={{
                                                                            // py: 1.5,
                                                                            borderRadius: '16px',
                                                                            textTransform: 'none',
                                                                            fontWeight: 600,
                                                                            border: '1px solid #063455',
                                                                            height: 35,
                                                                        }}
                                                                    >
                                                                        Save
                                                                    </Button>
                                                                    <Button
                                                                        onClick={(e) => handleSubmit(e, 'unpaid', true)}
                                                                        variant="outlined"
                                                                        size="small"
                                                                        disabled={submitting || invoiceItems.length === 0}
                                                                        sx={{
                                                                            // py: 1.5,
                                                                            borderRadius: '16px',
                                                                            color: '#063455',
                                                                            // borderColor: '#0a3d62',
                                                                            textTransform: 'none',
                                                                            fontWeight: 600,
                                                                            border: '1px solid #063455',
                                                                            height: 35,
                                                                        }}
                                                                    >
                                                                        {submitting ? <CircularProgress size={20} sx={{ mr: 1 }} /> : <Print sx={{ mr: 1 }} />}
                                                                        Save & Print
                                                                    </Button>
                                                                </>
                                                            )}
                                                            <Button
                                                                onClick={(e) => handleSubmit(e, 'paid')}
                                                                variant="contained"
                                                                size="small"
                                                                disabled={submitting || invoiceItems.length === 0}
                                                                sx={{
                                                                    // py: 1.5,
                                                                    bgcolor: '#063455',
                                                                    borderRadius: '16px',
                                                                    textTransform: 'none',
                                                                    fontWeight: 600,
                                                                    border: '1px solid #063455',
                                                                    height: 35,
                                                                }}
                                                            >
                                                                {submitting ? <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} /> : <Save sx={{ mr: 1 }} />}
                                                                Save & Receive
                                                            </Button>
                                                        </Box>
                                                    </Grid>
                                                </Grid>
                                            </form>
                                        ) : (
                                            <Alert severity="info">Please search and select a member to create a transaction.</Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Right Column Removed - Merged into simplified top bar above */}
                        </Grid>
                    </Grid>
                    {/* Step 3: Transaction History */}
                    {selectedMember && !paymentMode && (
                        <Grid item xs={12} id="transaction-history-section">
                            <Card sx={{ mb: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box
                                            sx={{
                                                bgcolor: '#063455',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 24,
                                                height: 24,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2,
                                                fontSize: '12px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            3
                                        </Box>
                                        <Typography sx={{ fontWeight: 600, color: '#063455', fontSize: '18px' }}>Transaction History - {selectedMember.full_name}</Typography>
                                    </Box>

                                    {/* Search Bar */}
                                    <Box sx={{ mb: 3 }}>
                                        <TextField
                                            size="small"
                                            fullWidth
                                            placeholder="Search by invoice number..."
                                            value={searchInvoice}
                                            onChange={(e) => handleSearchInvoice(e.target.value)}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <Search sx={{ color: 'action.active' }} />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            sx={{
                                                width: '250px',
                                                '& .MuiOutlinedInput-root': {
                                                    borderRadius: '16px',
                                                    bgcolor: 'transparent',
                                                },
                                            }}
                                        />
                                    </Box>

                                    {loadingTransactions ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <>
                                            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '12px' }}>
                                                <Table>
                                                    <TableHead sx={{ bgcolor: '#063455' }}>
                                                        <TableRow>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Invoice No</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Fee Type</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Details</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Amount</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Payment Method</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Invoice</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Action</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Status</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Payment Date</TableCell>
                                                            <TableCell sx={{ color: '#fff', fontWeight: '600', whiteSpace: 'nowrap' }}>Period</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {currentTransactions.length > 0 ? (
                                                            currentTransactions.map((transaction) => (
                                                                <TableRow key={transaction.id}>
                                                                    <TableCell sx={{ color: '#000', fontWeight: '600', whiteSpace: 'nowrap' }}>{transaction.invoice_no}</TableCell>
                                                                    {/* <TableCell>
                                                                        {transaction.items && transaction.items.length > 0 ? (
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                                {transaction.items.map((item, idx) => {
                                                                                    let label = item.fee_type || item.invoice_type || 'Item';
                                                                                    // Check if it's a numeric ID
                                                                                    const typeObj = transactionTypes.find((t) => t.id == label || t.id == item.fee_type);
                                                                                    if (typeObj) {
                                                                                        label = typeObj.name;
                                                                                    }
                                                                                    return <Chip key={idx} label={label.toString().replace('_', ' ')} color="primary" size="small" sx={{ bgcolor: '#063455', textTransform: 'capitalize', maxWidth: 'fit-content' }} />;
                                                                                })}
                                                                            </Box>
                                                                        ) : (
                                                                            <Chip label={transaction.fee_type?.replace('_', ' ')} color={transaction.fee_type === 'membership_fee' ? 'primary' : transaction.fee_type === 'subscription_fee' ? 'success' : 'secondary'} size="small" sx={{ bgcolor: '#063455', textTransform: 'capitalize' }} />
                                                                        )}
                                                                    </TableCell> */}
                                                                    <TableCell>
                                                                        {transaction.items && transaction.items.length > 0 ? (
                                                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                                                {transaction.items.map((item, idx) => {
                                                                                    let label = item.fee_type || item.invoice_type || '';

                                                                                    // Map numeric IDs to names
                                                                                    const typeObj = transactionTypes.find((t) => t.id == label || t.id == item.fee_type);

                                                                                    if (typeObj) {
                                                                                        label = typeObj.name;
                                                                                    }

                                                                                    // ❗ Do NOT render chip if label is empty
                                                                                    if (!label || label.toString().trim() === '') return null;

                                                                                    return (
                                                                                        <Chip
                                                                                            key={idx}
                                                                                            label={label.toString().replace('_', ' ')}
                                                                                            size="small"
                                                                                            sx={{
                                                                                                bgcolor: '#063455',
                                                                                                textTransform: 'capitalize',
                                                                                                maxWidth: 'fit-content',
                                                                                                color: '#fff',
                                                                                            }}
                                                                                        />
                                                                                    );
                                                                                })}
                                                                            </Box>
                                                                        ) : transaction.fee_type && transaction.fee_type.trim() !== '' ? (
                                                                            <Chip
                                                                                label={transaction.fee_type.replace('_', ' ')}
                                                                                size="small"
                                                                                sx={{
                                                                                    bgcolor: '#063455',
                                                                                    textTransform: 'capitalize',
                                                                                    color: '#fff',
                                                                                    maxWidth: 'fit-content',
                                                                                }}
                                                                            />
                                                                        ) : null}
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400', fontSize: '14px', whiteSpace: 'nowrap' }}>
                                                                        {transaction.items && transaction.items.length > 0 ? (
                                                                            <Box>
                                                                                {transaction.items.map((item, idx) => (
                                                                                    <Box key={idx} sx={{ mb: 0.5 }}>
                                                                                        <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', textTransform: 'capitalize' }}>
                                                                                            {item.description || item.fee_type?.replace('_', ' ')}
                                                                                        </Typography>
                                                                                        {item.fee_type === 'subscription_fee' && item.subscription_type_id && (
                                                                                            <Typography variant="caption" color="text.secondary">
                                                                                                {/* Ideally load names, but might need ID lookup or specific resource loading if not joined */}
                                                                                                {/* Fallback to legacy structure if present or generic */}
                                                                                                Subscription
                                                                                            </Typography>
                                                                                        )}
                                                                                    </Box>
                                                                                ))}
                                                                            </Box>
                                                                        ) : transaction.fee_type === 'subscription_fee' ? (
                                                                            <Box>
                                                                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                                                                    {transaction.data?.subscription_type_name || 'Subscription'}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    {transaction.data?.subscription_category_name || 'Category'}
                                                                                </Typography>
                                                                            </Box>
                                                                        ) : transaction.fee_type === 'maintenance_fee' ? (
                                                                            <Box>
                                                                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                                                                    {transaction.payment_frequency?.toUpperCase() || 'QUARTERLY'}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    Q{transaction.quarter_number || 1}
                                                                                </Typography>
                                                                            </Box>
                                                                        ) : (
                                                                            <Typography variant="caption" color="text.secondary">
                                                                                {transaction.remarks || 'Lifetime Membership'}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '100px', whiteSpace: 'nowrap' }}>
                                                                        <Tooltip title={formatCurrency(transaction.total_price)} arrow>
                                                                            {formatCurrency(transaction.total_price)}
                                                                        </Tooltip>
                                                                    </TableCell>
                                                                    {/* <TableCell>
                                                                        <Chip label={transaction.payment_method === 'credit_card' ? `💳 ${transaction.credit_card_type?.toUpperCase() || 'CARD'}` : '💵 CASH'} color={transaction.payment_method === 'credit_card' ? 'info' : 'default'} size="small" />
                                                                    </TableCell> */}
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={toTitleCase(transaction.status)}
                                                                            size="small"
                                                                            sx={{
                                                                                backgroundColor: getStatusStyle(transaction.status).bg,
                                                                                color: getStatusStyle(transaction.status).color,
                                                                                fontWeight: 500,
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            size="small"
                                                                            variant="outlined"
                                                                            // startIcon={<Visibility />}
                                                                            onClick={() => {
                                                                                setCreatedInvoiceId(transaction.id);
                                                                                setCreatedMemberId(transaction.invoice_no);
                                                                                setShowInvoiceModal(true);
                                                                            }}
                                                                            sx={{ color: '#063455', bgcolor: 'transparent', border: '1px solid #063455', textTransform: 'none' }}
                                                                        >
                                                                            View
                                                                        </Button>
                                                                    </TableCell>
                                                                    <TableCell style={{ whiteSpace: 'nowrap' }}>
                                                                        {transaction.status === 'unpaid' && (
                                                                            <Button size="small" variant="contained" color="success" startIcon={<Payment />} onClick={() => router.visit(route('finance.invoice.pay', transaction.id))} sx={{ whiteSpace: 'nowrap', textTransform: 'none' }}>
                                                                                Pay
                                                                            </Button>
                                                                        )}
                                                                        {transaction.status !== 'cancelled' && (
                                                                            <Tooltip title="Cancel Invoice">
                                                                                <IconButton size="small" color="error" onClick={() => handleCancelClick(transaction)} sx={{ ml: 1 }}>
                                                                                    <CancelIcon />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                    </TableCell>
                                                                    {/* <TableCell>
                                                                        <Chip label={transaction.status} color={getStatusColor(transaction.status)} size="small" />
                                                                    </TableCell> */}
                                                                    <TableCell>
                                                                        <Chip
                                                                            label={toTitleCase(transaction.status)}
                                                                            size="small"
                                                                            sx={{
                                                                                backgroundColor: getStatusStyle(transaction.status).bg,
                                                                                color: getStatusStyle(transaction.status).color,
                                                                                fontWeight: 500,
                                                                                borderRadius: '12px',
                                                                                minWidth: '80px',
                                                                                textAlign: 'center',
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400', whiteSpace: 'nowrap' }}>{transaction.payment_date ? formatDate(transaction.payment_date) : '-'}</TableCell>
                                                                    <TableCell sx={{ color: '#7f7f7f', fontWeight: '400', whiteSpace: 'nowrap' }}>{transaction.valid_from && transaction.valid_to ? `${formatDate(transaction.valid_from)} - ${formatDate(transaction.valid_to)}` : '-'}</TableCell>
                                                                </TableRow>
                                                            ))
                                                        ) : (
                                                            <TableRow>
                                                                <TableCell colSpan={9} align="center">
                                                                    <Typography color="textSecondary">{searchInvoice ? `No transactions found matching "${searchInvoice}"` : 'No transactions found for this member'}</Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {/* Pagination */}
                                            {filteredTransactions.length > transactionsPerPage && (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Showing {indexOfFirstTransaction + 1}-{Math.min(indexOfLastTransaction, filteredTransactions.length)} of {filteredTransactions.length} transactions
                                                    </Typography>
                                                    <Pagination
                                                        count={totalPages}
                                                        page={currentPage}
                                                        onChange={handlePageChange}
                                                        color="primary"
                                                        size="medium"
                                                        showFirstButton
                                                        showLastButton
                                                        sx={{
                                                            '& .MuiPaginationItem-root': {
                                                                borderRadius: 2,
                                                            },
                                                        }}
                                                    />
                                                </Box>
                                            )}
                                        </>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>
                    )}
                </Grid>
            </Box>

            {/* Invoice Modal */}
            <MembershipInvoiceSlip
                open={showInvoiceModal}
                onClose={() => {
                    setShowInvoiceModal(false);
                }}
                invoiceNo={createdMemberId}
                invoiceId={createdInvoiceId}
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

            {/* Cancellation Dialog */}
            <Dialog open={cancellationOpen} onClose={() => setCancellationOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ bgcolor: '#d32f2f', color: 'white' }}>Cancel Invoice</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2, mt: 2 }}>
                        Are you sure you want to cancel this invoice? This action cannot be undone.
                        {transactionToCancel?.status === 'paid' && <span style={{ fontWeight: 'bold', display: 'block', color: '#d32f2f', marginTop: '8px' }}>WARNING: This is a PAID invoice. Cancelling it will VOID the payment and remove it from the ledger.</span>}
                    </Typography>
                    <TextField autoFocus margin="dense" label="Reason for Cancellation" fullWidth multiline rows={3} value={cancellationReason} onChange={(e) => setCancellationReason(e.target.value)} variant="outlined" />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setCancellationOpen(false)} disabled={cancelling}>
                        Back
                    </Button>
                    <Button onClick={handleConfirmCancellation} variant="contained" color="error" disabled={cancelling} startIcon={cancelling ? <CircularProgress size={20} color="inherit" /> : null}>
                        {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
