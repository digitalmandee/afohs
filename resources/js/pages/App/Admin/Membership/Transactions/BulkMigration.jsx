import React, { useState, useEffect } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Box, Card, CardContent, Typography, Grid, TextField, Button, FormControl, Select, MenuItem, Autocomplete, Chip, Alert, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Divider, Pagination, InputAdornment } from '@mui/material';
import { Add, Delete, Save, Person, Search, Receipt } from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import axios from 'axios';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
export default function BulkMigration() {
    // const [open, setOpen] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [payments, setPayments] = useState([]);
    const [validationErrors, setValidationErrors] = useState({});

    // Transaction history states
    const [memberTransactions, setMemberTransactions] = useState([]);
    const [loadingTransactions, setLoadingTransactions] = useState(false);
    const [searchInvoice, setSearchInvoice] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [transactionsPerPage] = useState(5);
    const [filteredTransactions, setFilteredTransactions] = useState([]);

    // Create initial payment row
    const createEmptyPayment = () => ({
        id: Date.now() + Math.random(),
        fee_type: '',
        payment_frequency: '',
        quarter_number: 1,
        amount: '',
        valid_from: '',
        valid_to: '',
        invoice_no: '',
        payment_date: '',
        discount_type: '',
        discount_value: '',
        payment_method: 'cash',
        credit_card_type: '',
        receipt_file: null,
    });

    // Initialize with one empty payment
    useEffect(() => {
        setPayments([createEmptyPayment()]);
    }, []);

    // Auto-update payments when member changes
    useEffect(() => {
        if (selectedMember && memberTransactions.length >= 0) {
            // Auto-update maintenance fee payments with suggested periods
            payments.forEach((payment, index) => {
                if (payment.fee_type === 'maintenance_fee' && payment.payment_frequency) {
                    // Trigger auto-suggestion for this payment
                    setTimeout(() => suggestMaintenancePeriod(payment.payment_frequency, index), 100);
                }
            });
        }
    }, [selectedMember, memberTransactions]);

    // Quarter analysis function (from Create.jsx)
    const analyzeQuarterStatus = (transactions, membershipDate) => {
        if (!membershipDate) {
            return {
                paidQuarters: [],
                nextAvailableQuarter: 1,
                currentYear: new Date().getFullYear(),
                isNewCycle: false,
                latestEndDate: null,
            };
        }

        const membershipYear = new Date(membershipDate).getFullYear();
        const membershipMonth = new Date(membershipDate).getMonth(); // 0-based (0 = Jan, 11 = Dec)
        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();

        // Get maintenance fee transactions
        const maintenanceTransactions = transactions.filter((t) => t.fee_type === 'maintenance_fee' && t.status === 'paid');

        // Sort transactions by validity end date (latest first)
        const sortedTransactions = [...maintenanceTransactions].sort((a, b) => new Date(b.valid_to) - new Date(a.valid_to));

        let paidQuarters = [];
        let latestEndDate = null;

        if (sortedTransactions.length > 0) {
            const mostRecentTransaction = sortedTransactions[0];
            const mostRecentEnd = new Date(mostRecentTransaction.valid_to);

            latestEndDate = mostRecentEnd.toISOString().split('T')[0];
        }

        // Check if we're still in the first year (monthly payment system)
        const firstYearEnd = new Date(Date.UTC(membershipYear, 11, 31)); // Dec 31 of membership year
        const isFirstYear = !latestEndDate || new Date(latestEndDate) <= firstYearEnd;

        if (isFirstYear) {
            // FIRST YEAR: Monthly payment system (only show if still in first year AND not all months paid)
            const monthsInFirstYear = [];
            for (let month = membershipMonth + 1; month <= 11; month++) {
                monthsInFirstYear.push(month);
            }

            const paidMonthsInFirstYear = [];
            sortedTransactions.forEach((transaction) => {
                const txStart = new Date(transaction.valid_from);
                const txEnd = new Date(transaction.valid_to);

                let currentDate = new Date(txStart.getFullYear(), txStart.getMonth(), 1);
                const endDate = new Date(txEnd.getFullYear(), txEnd.getMonth(), 1);

                while (currentDate <= endDate) {
                    const month = currentDate.getMonth();
                    const year = currentDate.getFullYear();

                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0);
                    const hasOverlap = txStart <= monthEnd && txEnd >= monthStart;

                    if (hasOverlap && year === membershipYear && monthsInFirstYear.includes(month) && !paidMonthsInFirstYear.includes(month)) {
                        paidMonthsInFirstYear.push(month);
                    }

                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            });

            const allFirstYearMonthsPaid = paidMonthsInFirstYear.length >= monthsInFirstYear.length;

            if (!allFirstYearMonthsPaid) {
                // Map months to quarters for display (approximate)
                paidMonthsInFirstYear.forEach((month) => {
                    const quarter = Math.floor(month / 3) + 1; // 0-2->Q1, 3-5->Q2, 6-8->Q3, 9-11->Q4
                    if (!paidQuarters.includes(quarter)) {
                        paidQuarters.push(quarter);
                    }
                });
            }
        } else {
            // SUBSEQUENT YEARS: Quarterly payment logic (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
            // Use current year for analysis (not membership year + offset)
            const analysisYear = currentYear;

            // Filter transactions for current year analysis
            const quarterlyTransactions = sortedTransactions.filter((transaction) => {
                const txStart = new Date(transaction.valid_from);
                const txEnd = new Date(transaction.valid_to);

                // Include transactions that overlap with current analysis year
                return (txStart.getFullYear() <= analysisYear && txEnd.getFullYear() >= analysisYear) || txStart.getFullYear() === analysisYear || txEnd.getFullYear() === analysisYear;
            });

            // Analyze which months are covered by all transactions combined
            const paidMonthsInYear = new Set();

            quarterlyTransactions.forEach((transaction) => {
                const txStart = new Date(transaction.valid_from);
                const txEnd = new Date(transaction.valid_to);

                // Mark each month covered by this transaction
                let currentDate = new Date(txStart.getFullYear(), txStart.getMonth(), 1);
                const endDate = new Date(txEnd.getFullYear(), txEnd.getMonth(), 1);

                while (currentDate <= endDate) {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth();

                    // Count months from current analysis year
                    if (year === analysisYear) {
                        const monthKey = `${year}-${month}`;
                        paidMonthsInYear.add(monthKey);
                    }

                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            });

            // Now check which quarters are completely covered and track partial quarters
            const currentAnalysisYear = analysisYear; // Use current year for analysis
            const partialQuarters = {}; // Track which quarters are partially paid

            for (let quarter = 1; quarter <= 4; quarter++) {
                const quarterStartMonth = (quarter - 1) * 3; // Q1=0(Jan), Q2=3(Apr), Q3=6(Jul), Q4=9(Oct)
                const monthsInQuarter = [quarterStartMonth, quarterStartMonth + 1, quarterStartMonth + 2];

                const paidMonthsInQuarter = monthsInQuarter.filter((month) => {
                    const monthKey = `${currentAnalysisYear}-${month}`;
                    return paidMonthsInYear.has(monthKey);
                });

                const allMonthsPaid = paidMonthsInQuarter.length === 3;
                const someMonthsPaid = paidMonthsInQuarter.length > 0;

                if (allMonthsPaid) {
                    paidQuarters.push(quarter);
                } else if (someMonthsPaid) {
                    // Track partial quarter info
                    const unpaidMonths = monthsInQuarter.filter((month) => {
                        const monthKey = `${currentAnalysisYear}-${month}`;
                        return !paidMonthsInYear.has(monthKey);
                    });

                    partialQuarters[quarter] = {
                        paidMonths: paidMonthsInQuarter,
                        unpaidMonths: unpaidMonths,
                        nextUnpaidMonth: Math.min(...unpaidMonths),
                    };
                }
            }

            // Store partial quarter info for later use
            window.partialQuarters = partialQuarters;
        }

        paidQuarters.sort((a, b) => a - b);

        // Determine next payment period
        let nextQuarter = 1;
        let isNewCycle = false;

        if (isFirstYear) {
            // For first year, determine next month to pay
            const monthsInFirstYear = [];
            for (let month = membershipMonth + 1; month <= 11; month++) {
                monthsInFirstYear.push(month);
            }

            const paidMonths = [];
            sortedTransactions.forEach((transaction) => {
                const txStart = new Date(transaction.valid_from);
                const txEnd = new Date(transaction.valid_to);

                // More accurate month detection: check each month the transaction spans
                let currentDate = new Date(txStart.getFullYear(), txStart.getMonth(), 1);
                const endDate = new Date(txEnd.getFullYear(), txEnd.getMonth(), 1);

                while (currentDate <= endDate) {
                    const month = currentDate.getMonth();
                    const year = currentDate.getFullYear();

                    // Check if this month overlaps with the transaction period
                    const monthStart = new Date(year, month, 1);
                    const monthEnd = new Date(year, month + 1, 0); // Last day of month

                    // Transaction covers this month if there's any overlap
                    const hasOverlap = txStart <= monthEnd && txEnd >= monthStart;

                    if (hasOverlap && year === membershipYear && monthsInFirstYear.includes(month) && !paidMonths.includes(month)) {
                        paidMonths.push(month);
                    }

                    currentDate.setMonth(currentDate.getMonth() + 1);
                }
            });

            // Check if all first year months are paid
            if (paidMonths.length >= monthsInFirstYear.length) {
                // Move to quarterly system for next year
                nextQuarter = 1;
                isNewCycle = true;
            } else {
                // Still in first year, find next month
                const nextMonth = monthsInFirstYear.find((month) => !paidMonths.includes(month));
                nextQuarter = Math.floor((nextMonth || 0) / 3) + 1;
            }
        } else {
            // Quarterly system logic
            const hasAllQuarters = paidQuarters.includes(1) && paidQuarters.includes(2) && paidQuarters.includes(3) && paidQuarters.includes(4);
            const partialQuarters = window.partialQuarters || {};

            if (hasAllQuarters) {
                nextQuarter = 1;
                isNewCycle = true;
                paidQuarters = []; // Reset for new cycle display
            } else {
                // Check for partial quarters first (priority)
                let foundPartialQuarter = false;
                for (let i = 1; i <= 4; i++) {
                    if (partialQuarters[i]) {
                        nextQuarter = i;
                        foundPartialQuarter = true;
                        break;
                    }
                }

                // If no partial quarters, find next unpaid quarter
                if (!foundPartialQuarter) {
                    for (let i = 1; i <= 4; i++) {
                        if (!paidQuarters.includes(i)) {
                            nextQuarter = i;
                            break;
                        }
                    }
                }
                isNewCycle = false;
            }
        }

        return {
            paidQuarters,
            nextAvailableQuarter: nextQuarter,
            currentYear: currentYear,
            isNewCycle,
            latestEndDate,
        };
    };

    // Payment suggestion function (from Create.jsx)
    const suggestMaintenancePeriod = (frequency, paymentIndex) => {
        if (!selectedMember) {
            return;
        }

        const membershipDate = new Date(selectedMember.membership_date);
        const membershipYear = membershipDate.getFullYear();
        const membershipMonth = membershipDate.getMonth(); // 0-based
        const currentYear = new Date().getFullYear();

        const quarterStatus = analyzeQuarterStatus(memberTransactions, membershipDate);

        // Check if we're still in the first year (monthly payment system)
        const firstYearEnd = new Date(Date.UTC(membershipYear, 11, 31)); // Dec 31 of membership year
        const isFirstYear = !quarterStatus.latestEndDate || new Date(quarterStatus.latestEndDate) <= firstYearEnd;

        // Check if all first year months are already paid
        const monthsInFirstYear = [];
        for (let month = membershipMonth + 1; month <= 11; month++) {
            monthsInFirstYear.push(month);
        }

        const paidMonths = [];
        const maintenanceTransactions = memberTransactions.filter((t) => t.fee_type === 'maintenance_fee' && t.status === 'paid');
        maintenanceTransactions.forEach((transaction) => {
            const txStart = new Date(transaction.valid_from);
            const txEnd = new Date(transaction.valid_to);

            let currentDate = new Date(txStart.getFullYear(), txStart.getMonth(), 1);
            const endDate = new Date(txEnd.getFullYear(), txEnd.getMonth(), 1);

            while (currentDate <= endDate) {
                const month = currentDate.getMonth();
                const year = currentDate.getFullYear();

                const monthStart = new Date(year, month, 1);
                const monthEnd = new Date(year, month + 1, 0);
                const hasOverlap = txStart <= monthEnd && txEnd >= monthStart;

                if (hasOverlap && year === membershipYear && monthsInFirstYear.includes(month) && !paidMonths.includes(month)) {
                    paidMonths.push(month);
                }

                currentDate.setMonth(currentDate.getMonth() + 1);
            }
        });

        const allFirstYearMonthsPaid = paidMonths.length >= monthsInFirstYear.length;

        let startDate, endDate, amount;

        if (isFirstYear && !allFirstYearMonthsPaid) {
            // FIRST YEAR: Monthly payment system (only if not all months are paid)
            if (quarterStatus.latestEndDate && paidMonths.length > 0) {
                // Continue from where last payment ended - start from first day of next month
                const lastEndDate = new Date(quarterStatus.latestEndDate);
                // Use UTC to avoid timezone issues and start from first day of next month
                startDate = new Date(Date.UTC(lastEndDate.getUTCFullYear(), lastEndDate.getUTCMonth() + 1, 1));
            } else {
                // Start from the month after membership month (for new members or no payments)
                // Use UTC to avoid timezone issues
                startDate = new Date(Date.UTC(membershipYear, membershipMonth + 1, 1));
            }

            // Calculate how many months to pay based on frequency
            let monthsToAdd;
            if (frequency === 'monthly') {
                monthsToAdd = 1;
            } else if (frequency === 'quarterly') {
                monthsToAdd = 3;
            } else if (frequency === 'half_yearly') {
                monthsToAdd = 6;
            } else if (frequency === 'three_quarters') {
                monthsToAdd = 9;
            } else {
                // annually
                monthsToAdd = 12;
            }

            // Calculate end date using complete months
            endDate = new Date(startDate);
            endDate.setUTCMonth(startDate.getUTCMonth() + monthsToAdd);
            endDate.setUTCDate(0); // Last day of previous month (complete month)

            // Cap at December 31st of membership year
            if (endDate > firstYearEnd) {
                endDate = new Date(firstYearEnd);
            }

            // Calculate amount based on actual months covered
            const actualMonths = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30));
            const monthlyFee = selectedMember.member_category.subscription_fee / 3; // Quarterly fee / 3 months
            amount = Math.round(monthlyFee * actualMonths);
        } else {
            // SUBSEQUENT YEARS OR FIRST YEAR COMPLETE: Quarterly payment system (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
            // But also support monthly payments and partial quarter completion
            const partialQuarters = window.partialQuarters || {};
            const currentPartialQuarter = partialQuarters[quarterStatus.nextAvailableQuarter];

            let quartersToAdd, monthsToAdd;

            // Check if we're completing a partial quarter
            if (currentPartialQuarter && frequency === 'quarterly') {
                // For partial quarter completion, only pay remaining months
                monthsToAdd = currentPartialQuarter.unpaidMonths.length;
                quartersToAdd = 1;
            } else if (frequency === 'monthly') {
                monthsToAdd = 1;
                quartersToAdd = 1; // For calculation purposes
            } else if (frequency === 'quarterly') {
                monthsToAdd = 3;
                quartersToAdd = 1;
            } else if (frequency === 'half_yearly') {
                monthsToAdd = 6;
                quartersToAdd = 2;
            } else if (frequency === 'three_quarters') {
                monthsToAdd = 9;
                quartersToAdd = 3;
            } else {
                // annually
                monthsToAdd = 12;
                quartersToAdd = 4;
            }

            if (quarterStatus.latestEndDate && !allFirstYearMonthsPaid) {
                // Continue from where last payment ended - start from first day of next month
                const lastEndDate = new Date(quarterStatus.latestEndDate);
                startDate = new Date(Date.UTC(lastEndDate.getUTCFullYear(), lastEndDate.getUTCMonth() + 1, 1));
            } else if (allFirstYearMonthsPaid || !isFirstYear) {
                // Start from January 1st of the year after membership year, or continue quarterly system
                if (currentPartialQuarter) {
                    // For partial quarters, start from the first unpaid month in that quarter
                    const nextUnpaidMonth = currentPartialQuarter.nextUnpaidMonth;
                    startDate = new Date(Date.UTC(currentYear, nextUnpaidMonth, 1));
                } else if (quarterStatus.latestEndDate) {
                    const lastEndDate = new Date(quarterStatus.latestEndDate);
                    startDate = new Date(Date.UTC(lastEndDate.getUTCFullYear(), lastEndDate.getUTCMonth() + 1, 1));
                } else {
                    // Start from current year if no previous payments
                    startDate = new Date(Date.UTC(currentYear, 0, 1));
                }
            } else {
                // Start from current year if no previous payments
                startDate = new Date(Date.UTC(currentYear, 0, 1));
            }

            // Calculate end date by adding months - complete months
            endDate = new Date(startDate);
            endDate.setUTCMonth(startDate.getUTCMonth() + monthsToAdd);
            endDate.setUTCDate(0); // Last day of previous month (complete month)

            // Calculate amount based on frequency and partial quarter logic
            if (frequency === 'monthly') {
                const monthlyFee = selectedMember.member_category.subscription_fee / 3; // Quarterly fee / 3 months
                amount = Math.round(monthlyFee);
            } else if (currentPartialQuarter && frequency === 'quarterly') {
                // For partial quarter completion, charge only for remaining months
                const monthlyFee = selectedMember.member_category.subscription_fee / 3;
                amount = Math.round(monthlyFee * monthsToAdd);
            } else {
                const quarterlyAmount = selectedMember.member_category.subscription_fee;
                amount = quarterlyAmount * quartersToAdd;
            }
        }

        // Update the specific payment in the array
        const updatedPayments = [...payments];
        updatedPayments[paymentIndex] = {
            ...updatedPayments[paymentIndex],
            valid_from: startDate.toISOString().split('T')[0],
            valid_to: endDate.toISOString().split('T')[0],
            amount: amount,
            quarter_number: quarterStatus.nextAvailableQuarter,
        };
        setPayments(updatedPayments);
    };

    // Validate payment fields
    const validatePayment = (payment) => {
        const errors = {};

        // Required fields validation
        if (!payment.fee_type) {
            errors.fee_type = 'Fee type is required';
        }

        if (!payment.amount || payment.amount <= 0) {
            errors.amount = 'Amount must be greater than 0';
        }

        // Only require dates for maintenance fees
        if (payment.fee_type === 'maintenance_fee') {
            if (!payment.valid_from) {
                errors.valid_from = 'Valid from date is required for maintenance fees';
            }

            if (!payment.valid_to) {
                errors.valid_to = 'Valid to date is required for maintenance fees';
            }
        }

        if (!payment.invoice_no) {
            errors.invoice_no = 'Invoice number is required';
        }

        if (!payment.payment_date) {
            errors.payment_date = 'Payment date is required';
        }

        // Maintenance fee specific validation
        if (payment.fee_type === 'maintenance_fee') {
            if (!payment.payment_frequency) {
                errors.payment_frequency = 'Payment frequency is required for maintenance fee';
            }

            if (!payment.quarter_number || payment.quarter_number < 1 || payment.quarter_number > 4) {
                errors.quarter_number = 'Quarter number must be between 1-4';
            }
        }

        // Credit card validation
        if (payment.payment_method === 'credit_card') {
            if (!payment.credit_card_type) {
                errors.credit_card_type = 'Credit card type is required';
            }

            if (!payment.receipt_file) {
                errors.receipt_file = 'Receipt file is required for credit card payments';
            }
        }

        // Date validation
        if (payment.valid_from && payment.valid_to) {
            const fromDate = new Date(payment.valid_from);
            const toDate = new Date(payment.valid_to);

            if (toDate <= fromDate) {
                errors.valid_to = 'Valid to date must be after valid from date';
            }
        }

        // Discount validation
        if (payment.discount_type && payment.discount_value) {
            const discountValue = parseFloat(payment.discount_value);

            if (payment.discount_type === 'percent' && (discountValue < 0 || discountValue > 100)) {
                errors.discount_value = 'Percentage discount must be between 0-100';
            }

            if (payment.discount_type === 'fixed' && discountValue < 0) {
                errors.discount_value = 'Fixed discount cannot be negative';
            }

            if (payment.discount_type === 'fixed' && discountValue >= parseFloat(payment.amount)) {
                errors.discount_value = 'Fixed discount cannot be greater than or equal to amount';
            }
        }

        return errors;
    };

    // Validate all payments
    const validateAllPayments = () => {
        const allErrors = {};
        let hasErrors = false;

        payments.forEach((payment) => {
            const paymentErrors = validatePayment(payment);
            if (Object.keys(paymentErrors).length > 0) {
                allErrors[payment.id] = paymentErrors;
                hasErrors = true;
            }
        });

        setValidationErrors(allErrors);
        return !hasErrors;
    };

    // Update payment with validation
    const updatePaymentWithValidation = (paymentId, field, value) => {
        updatePayment(paymentId, field, value);

        // Clear validation error for this field
        setValidationErrors((prev) => {
            const newErrors = { ...prev };
            if (newErrors[paymentId]) {
                delete newErrors[paymentId][field];
                if (Object.keys(newErrors[paymentId]).length === 0) {
                    delete newErrors[paymentId];
                }
            }
            return newErrors;
        });

        // Re-validate this payment after a short delay
        setTimeout(() => {
            const payment = payments.find((p) => p.id === paymentId);
            if (payment) {
                const errors = validatePayment({ ...payment, [field]: value });
                if (Object.keys(errors).length > 0) {
                    setValidationErrors((prev) => ({
                        ...prev,
                        [paymentId]: errors,
                    }));
                }
            }
        }, 500);
    };

    // Search members function
    const searchMembers = async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }

        setSearchLoading(true);
        try {
            const response = await axios.get(route('membership.transactions.search'), {
                params: { query },
            });
            setSearchResults(response.data.members || []);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Handle member selection
    const handleMemberSelect = async (member) => {
        setSelectedMember(member);
        setLoadingTransactions(true);

        try {
            const response = await axios.get(route('membership.transactions.member', member.user_id));
            setMemberTransactions(response.data.transactions);
            setFilteredTransactions(response.data.transactions);
            setCurrentPage(1); // Reset pagination
            setSearchInvoice(''); // Reset search

            enqueueSnackbar(`Selected member: ${member.full_name}`, { variant: 'info' });

            // Auto-update maintenance fee payments with suggested periods
            const updatedPayments = payments.map((payment, index) => {
                if (payment.fee_type === 'maintenance_fee' && payment.payment_frequency) {
                    // Trigger auto-suggestion for this payment
                    setTimeout(() => suggestMaintenancePeriod(payment.payment_frequency, index), 100);
                }
                return payment;
            });
        } catch (error) {
            enqueueSnackbar('Error loading member data', { variant: 'error' });
        } finally {
            setLoadingTransactions(false);
        }
    };

    // Add new payment row
    const addNewPayment = () => {
        setPayments([...payments, createEmptyPayment()]);
    };

    // Remove payment row
    const removePayment = (id) => {
        if (payments.length > 1) {
            setPayments(payments.filter((p) => p.id !== id));
        }
    };

    // Update payment field
    const updatePayment = (id, field, value) => {
        setPayments(payments.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
    };

    // Handle fee type change for a payment
    const handleFeeTypeChange = (id, feeType) => {
        console.log('Fee type change:', { id, feeType, currentPayments: payments });
        setPayments(
            payments.map((p) => {
                if (p.id === id) {
                    if (feeType === 'membership_fee') {
                        // Set 4-year validity for membership fee
                        const today = new Date();
                        const endDate = new Date(today);
                        endDate.setFullYear(endDate.getFullYear() + 4);

                        return {
                            ...p,
                            fee_type: feeType,
                            valid_from: today.toISOString().split('T')[0],
                            valid_to: endDate.toISOString().split('T')[0],
                            payment_frequency: '',
                            quarter_number: 1,
                            amount: selectedMember?.member_category?.membership_fee || p.amount,
                        };
                    } else if (feeType === 'maintenance_fee') {
                        // Reset for maintenance fee
                        return {
                            ...p,
                            fee_type: feeType,
                            valid_from: '',
                            valid_to: '',
                            payment_frequency: 'quarterly',
                            quarter_number: 1,
                            amount: selectedMember?.member_category?.subscription_fee || p.amount,
                        };
                    } else {
                        // Just update fee type
                        return {
                            ...p,
                            fee_type: feeType,
                        };
                    }
                }
                return p;
            }),
        );
    };

    // Calculate total for a payment
    const calculatePaymentTotal = (payment) => {
        const amount = parseFloat(payment.amount) || 0;
        const discountValue = parseFloat(payment.discount_value) || 0;

        if (!payment.discount_type || !discountValue) return Math.round(amount);

        let total;
        if (payment.discount_type === 'percent') {
            total = amount - (amount * discountValue) / 100;
        } else {
            total = amount - discountValue;
        }

        return Math.round(total);
    };

    // Calculate grand total
    const calculateGrandTotal = () => {
        const total = payments.reduce((total, payment) => total + calculatePaymentTotal(payment), 0);
        return Math.round(total);
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

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PK', {
            style: 'currency',
            currency: 'PKR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(Math.round(amount));
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dayjs(dateString).format('DD-MM-YYYY');
    };

    // Get status color for chips
    const getStatusColor = (status) => {
        switch (status) {
            case 'paid':
                return 'success';
            case 'pending':
                return 'warning';
            case 'overdue':
                return 'error';
            default:
                return 'default';
        }
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedMember) {
            enqueueSnackbar('Please select a member first', { variant: 'error' });
            return;
        }

        // Validate all payments
        if (!validateAllPayments()) {
            enqueueSnackbar('Please fix all validation errors before submitting', { variant: 'error' });
            return;
        }

        const validPayments = payments.filter((p) => p.fee_type && p.amount && p.valid_from && p.valid_to && p.invoice_no);

        if (validPayments.length === 0) {
            enqueueSnackbar('Please fill at least one complete payment', { variant: 'error' });
            return;
        }

        setSubmitting(true);

        try {
            // Create FormData for file uploads
            const formData = new FormData();
            formData.append('member_id', selectedMember.user_id);

            // Add each payment with its files
            validPayments.forEach((payment, index) => {
                Object.keys(payment).forEach((key) => {
                    if (key === 'receipt_file' && payment[key]) {
                        formData.append(`payments[${index}][${key}]`, payment[key]);
                    } else if (key !== 'receipt_file' && payment[key] !== null && payment[key] !== '') {
                        formData.append(`payments[${index}][${key}]`, payment[key]);
                    }
                });
            });

            const response = await axios.post(route('membership.transactions.bulk-store'), formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                enqueueSnackbar(`Successfully created ${validPayments.length} transactions!`, { variant: 'success' });

                // Reset form
                setSelectedMember(null);
                setPayments([createEmptyPayment()]);
            }
        } catch (error) {
            console.error('Submission error:', error);
            enqueueSnackbar('Error creating transactions. Please try again.', { variant: 'error' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <Head title="Bulk Payment Migration" />
            {/* <SideNav open={open} setOpen={setOpen} /> */}

            <div
                style={{
                    // marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    // transition: 'margin-left 0.3s ease-in-out',
                    // marginTop: '5rem',
                    backgroundColor: '#f5f5f5',
                    minHeight: '100vh',
                }}
            >
                <Box sx={{ p: 4 }}>
                    {/* Header */}
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#063455', mb: 1 }}>
                            Payment Migration
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                            Import multiple payments from old system for a selected member
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Step 1: Member Selection */}
                        <Grid item xs={12}>
                            <Card sx={{ mb: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
                                <CardContent sx={{ p: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Box
                                            sx={{
                                                bgcolor: '#0a3d62',
                                                color: 'white',
                                                borderRadius: '50%',
                                                width: 32,
                                                height: 32,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                mr: 2,
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                        >
                                            1
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                            Select Member for Migration
                                        </Typography>
                                    </Box>

                                    <Autocomplete
                                        options={searchResults}
                                        getOptionLabel={(option) => `${option.full_name} (${option.membership_no})`}
                                        loading={searchLoading}
                                        onInputChange={(event, value) => searchMembers(value)}
                                        onChange={(event, value) => {
                                            if (value) handleMemberSelect(value);
                                        }}
                                        renderInput={(params) => (
                                            <TextField
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
                                            <Box component="li" {...props} sx={{ p: 2 }}>
                                                <Person sx={{ mr: 2, color: 'text.secondary' }} />
                                                <Box>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {option.full_name}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {option.membership_no} • {option.cnic_no} • {option.phone_no}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                    />

                                    {selectedMember && (
                                        <Box
                                            sx={{
                                                mt: 2,
                                                p: 2,
                                                bgcolor: 'success.50',
                                                borderRadius: 2,
                                                border: '1px solid',
                                                borderColor: 'success.200',
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                                <Person sx={{ mr: 1, color: 'success.main' }} />
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'success.main' }}>
                                                    Selected: {selectedMember.full_name}
                                                </Typography>
                                            </Box>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Membership No: <strong>{selectedMember.membership_no}</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        CNIC No: <strong>{selectedMember.cnic_no}</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Membership Date: <strong>{new Date(selectedMember.membership_date).toLocaleDateString()}</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        💳 Membership Fee: <strong style={{ color: '#059669' }}>Rs {selectedMember.member_category?.fee?.toLocaleString() || 'N/A'}</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        🔧 Maintenance Fee: <strong style={{ color: '#dc2626' }}>Rs {selectedMember.member_category?.subscription_fee?.toLocaleString() || 'N/A'}</strong>
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        📅 Monthly Rate: <strong style={{ color: '#7c3aed' }}>Rs {selectedMember.member_category?.subscription_fee ? Math.round(selectedMember.member_category.subscription_fee / 3).toLocaleString() : 'N/A'}</strong>
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Box>
                                    )}
                                </CardContent>
                            </Card>
                        </Grid>

                        {/* Step 2: Bulk Payments */}
                        {selectedMember && (
                            <Grid item xs={12}>
                                <Card sx={{ mb: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Box
                                                    sx={{
                                                        bgcolor: '#0a3d62',
                                                        color: 'white',
                                                        borderRadius: '50%',
                                                        width: 32,
                                                        height: 32,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        mr: 2,
                                                        fontSize: '14px',
                                                        fontWeight: 600,
                                                    }}
                                                >
                                                    2
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                    Add Multiple Payments
                                                </Typography>
                                            </Box>
                                            <Button variant="outlined" startIcon={<Add />} onClick={addNewPayment} sx={{ borderRadius: 2 }}>
                                                Add New Payment
                                            </Button>
                                        </Box>

                                        <form onSubmit={handleSubmit}>
                                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
                                                <Table>
                                                    <TableHead>
                                                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                                                            <TableCell sx={{ fontWeight: 600 }}>Fee Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Discount Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Discount Value</TableCell>
                                                            {/* Only show date columns if any payment is maintenance fee */}
                                                            {payments.some((p) => p.fee_type === 'maintenance_fee') && (
                                                                <>
                                                                    <TableCell sx={{ fontWeight: 600 }}>Valid From</TableCell>
                                                                    <TableCell sx={{ fontWeight: 600 }}>Valid To</TableCell>
                                                                </>
                                                            )}
                                                            <TableCell sx={{ fontWeight: 600 }}>Invoice No</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Payment Date</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Payment Method</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Card Type</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Receipt</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Total</TableCell>
                                                            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {payments.map((payment, index) => {
                                                            console.log('Rendering payment:', payment);
                                                            return (
                                                                <TableRow key={payment.id}>
                                                                    <TableCell>
                                                                        <FormControl size="small" sx={{ minWidth: 120 }} error={!!validationErrors[payment.id]?.fee_type}>
                                                                            <Select
                                                                                value={payment.fee_type || ''}
                                                                                onChange={(e) => {
                                                                                    handleFeeTypeChange(payment.id, e.target.value);
                                                                                    updatePaymentWithValidation(payment.id, 'fee_type', e.target.value);
                                                                                }}
                                                                                displayEmpty
                                                                            >
                                                                                <MenuItem value="">Select Fee Type</MenuItem>
                                                                                <MenuItem value="membership_fee">💳 Membership</MenuItem>
                                                                                <MenuItem value="maintenance_fee">🔧 Maintenance</MenuItem>
                                                                            </Select>
                                                                            {validationErrors[payment.id]?.fee_type && (
                                                                                <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                                                                                    {validationErrors[payment.id].fee_type}
                                                                                </Typography>
                                                                            )}
                                                                        </FormControl>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <TextField size="small" type="number" value={payment.amount} onChange={(e) => updatePaymentWithValidation(payment.id, 'amount', e.target.value)} onWheel={(e) => e.target.blur()} error={!!validationErrors[payment.id]?.amount} helperText={validationErrors[payment.id]?.amount} sx={{ width: 100 }} />
                                                                    </TableCell>

                                                                    {/* Discount Type */}
                                                                    <TableCell>
                                                                        <FormControl size="small" sx={{ minWidth: 120 }} error={!!validationErrors[payment.id]?.discount_type}>
                                                                            <Select value={payment.discount_type} onChange={(e) => updatePaymentWithValidation(payment.id, 'discount_type', e.target.value)} displayEmpty>
                                                                                <MenuItem value="">No Discount</MenuItem>
                                                                                <MenuItem value="percent">% Percent</MenuItem>
                                                                                <MenuItem value="fixed">💰 Fixed</MenuItem>
                                                                            </Select>
                                                                            {validationErrors[payment.id]?.discount_type && (
                                                                                <Typography variant="caption" color="error" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                                                                                    {validationErrors[payment.id].discount_type}
                                                                                </Typography>
                                                                            )}
                                                                        </FormControl>
                                                                    </TableCell>

                                                                    {/* Discount Value */}
                                                                    <TableCell>{payment.discount_type && <TextField size="small" type="number" value={payment.discount_value} onChange={(e) => updatePayment(payment.id, 'discount_value', e.target.value)} onWheel={(e) => e.target.blur()} placeholder={payment.discount_type === 'percent' ? '10' : '1000'} sx={{ width: 80 }} />}</TableCell>

                                                                    {/* Only show date fields if any payment is maintenance fee */}
                                                                    {payments.some((p) => p.fee_type === 'maintenance_fee') && (
                                                                        <>
                                                                            <TableCell>
                                                                                {payment.fee_type === 'maintenance_fee' ? (
                                                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                                        <DatePicker
                                                                                            value={payment.valid_from ? dayjs(payment.valid_from) : null}
                                                                                            onChange={(newValue) => updatePaymentWithValidation(payment.id, 'valid_from', newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')}
                                                                                            format="DD-MM-YYYY"
                                                                                            slotProps={{
                                                                                                textField: {
                                                                                                    size: 'small',
                                                                                                    error: !!validationErrors[payment.id]?.valid_from,
                                                                                                    helperText: validationErrors[payment.id]?.valid_from,
                                                                                                    InputLabelProps: { shrink: true },
                                                                                                    sx: { width: 140 },
                                                                                                    onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                                                                                },
                                                                                            }}
                                                                                        />
                                                                                    </LocalizationProvider>
                                                                                ) : (
                                                                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                                        Lifetime
                                                                                    </Typography>
                                                                                )}
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                {payment.fee_type === 'maintenance_fee' ? (
                                                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                                        <DatePicker
                                                                                            value={payment.valid_to ? dayjs(payment.valid_to) : null}
                                                                                            onChange={(newValue) => updatePaymentWithValidation(payment.id, 'valid_to', newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')}
                                                                                            format="DD-MM-YYYY"
                                                                                            slotProps={{
                                                                                                textField: {
                                                                                                    size: 'small',
                                                                                                    error: !!validationErrors[payment.id]?.valid_to,
                                                                                                    helperText: validationErrors[payment.id]?.valid_to,
                                                                                                    InputLabelProps: { shrink: true },
                                                                                                    sx: { width: 140 },
                                                                                                    onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                                                                                },
                                                                                            }}
                                                                                        />
                                                                                    </LocalizationProvider>
                                                                                ) : (
                                                                                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                                        Lifetime
                                                                                    </Typography>
                                                                                )}
                                                                            </TableCell>
                                                                        </>
                                                                    )}
                                                                    <TableCell>
                                                                        <TextField size="small" value={payment.invoice_no} onChange={(e) => updatePaymentWithValidation(payment.id, 'invoice_no', e.target.value)} error={!!validationErrors[payment.id]?.invoice_no} helperText={validationErrors[payment.id]?.invoice_no} placeholder="1" sx={{ width: 100 }} />
                                                                    </TableCell>

                                                                    {/* Payment Date */}
                                                                    <TableCell>
                                                                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                            <DatePicker
                                                                                value={payment.payment_date ? dayjs(payment.payment_date) : null}
                                                                                onChange={(newValue) => updatePaymentWithValidation(payment.id, 'payment_date', newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')}
                                                                                format="DD-MM-YYYY"
                                                                                slotProps={{
                                                                                    textField: {
                                                                                        size: 'small',
                                                                                        error: !!validationErrors[payment.id]?.payment_date,
                                                                                        helperText: validationErrors[payment.id]?.payment_date,
                                                                                        InputLabelProps: { shrink: true },
                                                                                        sx: { width: 140 },
                                                                                        onClick: (e) => e.target.closest('.MuiFormControl-root').querySelector('button')?.click(),
                                                                                    },
                                                                                }}
                                                                            />
                                                                        </LocalizationProvider>
                                                                    </TableCell>

                                                                    {/* Payment Method */}
                                                                    <TableCell>
                                                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                                                            <Select value={payment.payment_method || 'cash'} onChange={(e) => updatePayment(payment.id, 'payment_method', e.target.value)} displayEmpty>
                                                                                <MenuItem value="cash">💵 Cash</MenuItem>
                                                                                <MenuItem value="credit_card">💳 Card</MenuItem>
                                                                            </Select>
                                                                        </FormControl>
                                                                    </TableCell>

                                                                    {/* Credit Card Type */}
                                                                    <TableCell>
                                                                        {payment.payment_method === 'credit_card' && (
                                                                            <FormControl size="small" sx={{ minWidth: 100 }}>
                                                                                <Select value={payment.credit_card_type || ''} onChange={(e) => updatePayment(payment.id, 'credit_card_type', e.target.value)} displayEmpty>
                                                                                    <MenuItem value="">Select Card</MenuItem>
                                                                                    <MenuItem value="mastercard">🔴 MasterCard</MenuItem>
                                                                                    <MenuItem value="visa">🔵 Visa</MenuItem>
                                                                                </Select>
                                                                            </FormControl>
                                                                        )}
                                                                    </TableCell>

                                                                    {/* Receipt Upload */}
                                                                    <TableCell>
                                                                        {payment.payment_method === 'credit_card' && (
                                                                            <Box sx={{ width: 120 }}>
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*,.pdf"
                                                                                    onChange={(e) => updatePayment(payment.id, 'receipt_file', e.target.files[0])}
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        padding: '4px',
                                                                                        border: '1px solid #d1d5db',
                                                                                        borderRadius: '4px',
                                                                                        fontSize: '12px',
                                                                                        backgroundColor: '#f9fafb',
                                                                                    }}
                                                                                />
                                                                                {payment.receipt_file && (
                                                                                    <Typography variant="caption" color="success.main" sx={{ fontSize: '10px' }}>
                                                                                        ✅ {payment.receipt_file.name.substring(0, 15)}...
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        )}
                                                                    </TableCell>

                                                                    <TableCell>
                                                                        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                                                            {formatCurrency(calculatePaymentTotal(payment))}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <IconButton color="error" size="small" onClick={() => removePayment(payment.id)} disabled={payments.length === 1}>
                                                                            <Delete />
                                                                        </IconButton>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>

                                            {/* Grand Total */}
                                            <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.50', borderRadius: 2, border: '2px solid', borderColor: 'primary.200' }}>
                                                <Typography variant="h5" sx={{ fontWeight: 700, color: '#0a3d62', textAlign: 'center' }}>
                                                    💰 Grand Total: {formatCurrency(calculateGrandTotal())}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                                                    {payments.filter((p) => p.fee_type && p.amount).length} payments ready to save
                                                </Typography>
                                            </Box>

                                            {/* Submit Button */}
                                            <Button
                                                type="submit"
                                                variant="contained"
                                                size="large"
                                                fullWidth
                                                disabled={submitting || !selectedMember}
                                                startIcon={<Save />}
                                                sx={{
                                                    mt: 3,
                                                    py: 2,
                                                    bgcolor: '#0a3d62',
                                                    borderRadius: 2,
                                                    fontSize: '16px',
                                                    fontWeight: 600,
                                                    textTransform: 'none',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                                    '&:hover': {
                                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                                    },
                                                }}
                                            >
                                                {submitting ? (
                                                    <>
                                                        <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                                                        Saving All Payments...
                                                    </>
                                                ) : (
                                                    'Save All Payments'
                                                )}
                                            </Button>
                                        </form>
                                    </CardContent>
                                </Card>
                            </Grid>
                        )}

                        {/* Step 3: Transaction History */}
                        {selectedMember && (
                            <Grid item xs={12}>
                                <Card sx={{ mb: 3, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', borderRadius: 2 }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                            <Box
                                                sx={{
                                                    bgcolor: 'secondary.main',
                                                    color: 'white',
                                                    borderRadius: '50%',
                                                    width: 32,
                                                    height: 32,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    mr: 2,
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                3
                                            </Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
                                                Transaction History - {selectedMember.full_name}
                                            </Typography>
                                        </Box>

                                        {/* Search Bar */}
                                        <Box sx={{ mb: 3 }}>
                                            <TextField
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
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: 2,
                                                        bgcolor: 'grey.50',
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
                                                <TableContainer component={Paper} elevation={0}>
                                                    <Table>
                                                        <TableHead>
                                                            <TableRow>
                                                                <TableCell>Invoice No</TableCell>
                                                                <TableCell>Fee Type</TableCell>
                                                                <TableCell>Amount</TableCell>
                                                                <TableCell>Payment Method</TableCell>
                                                                <TableCell>Receipt</TableCell>
                                                                <TableCell>Status</TableCell>
                                                                <TableCell>Payment Date</TableCell>
                                                                <TableCell>Period</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {currentTransactions.length > 0 ? (
                                                                currentTransactions.map((transaction) => (
                                                                    <TableRow key={transaction.id}>
                                                                        <TableCell>{transaction.invoice_no}</TableCell>
                                                                        <TableCell>
                                                                            <Chip label={transaction.fee_type?.replace('_', ' ').toUpperCase()} color={transaction.fee_type === 'membership_fee' ? 'primary' : 'secondary'} size="small" />
                                                                        </TableCell>
                                                                        <TableCell>{formatCurrency(transaction.total_price)}</TableCell>
                                                                        <TableCell>
                                                                            <Chip label={transaction.payment_method === 'credit_card' ? `💳 ${transaction.credit_card_type?.toUpperCase() || 'CARD'}` : '💵 CASH'} color={transaction.payment_method === 'credit_card' ? 'info' : 'default'} size="small" />
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {transaction.receipt ? (
                                                                                <Button size="small" variant="outlined" startIcon={<Receipt />} onClick={() => window.open(`${transaction.receipt}`, '_blank')} sx={{ fontSize: '11px', py: 0.5, px: 1 }}>
                                                                                    View
                                                                                </Button>
                                                                            ) : (
                                                                                <Typography variant="caption" color="text.secondary">
                                                                                    No Receipt
                                                                                </Typography>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Chip label={transaction.status?.toUpperCase()} color={getStatusColor(transaction.status)} size="small" />
                                                                        </TableCell>
                                                                        <TableCell>{transaction.payment_date ? formatDate(transaction.payment_date) : '-'}</TableCell>
                                                                        <TableCell>{transaction.valid_from && transaction.valid_to ? `${formatDate(transaction.valid_from)} - ${formatDate(transaction.valid_to)}` : '-'}</TableCell>
                                                                    </TableRow>
                                                                ))
                                                            ) : (
                                                                <TableRow>
                                                                    <TableCell colSpan={8} align="center">
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
            </div>
        </>
    );
}
