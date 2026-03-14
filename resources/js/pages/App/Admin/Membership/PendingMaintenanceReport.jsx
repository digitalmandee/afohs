import { useState, useMemo, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { TextField, Chip, IconButton, Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Button, InputAdornment, Grid, FormControl, InputLabel, Select, MenuItem, Pagination, Autocomplete, CircularProgress } from '@mui/material';
import { Search, Print, ArrowBack } from '@mui/icons-material';
import PendingMaintenanceInvoiceSlip from './PendingMaintenanceInvoiceSlip';
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export const PendingMaintenanceReportView = ({
    initialMembers,
    initialStatistics,
    initialFilters,
    all_statuses,
    all_categories,
    embedded = false,
    onClose,
}) => {

    // Modal state
    // const [open, setOpen] = useState(true);
    const [selectedMembers, setSelectedMembers] = useState([]);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [newStatus, setNewStatus] = useState('');
    const [statusReason, setStatusReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [membersData, setMembersData] = useState(initialMembers || null);
    const [statisticsData, setStatisticsData] = useState(initialStatistics || null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const [allFilters, setAllFilters] = useState({
        member_search: initialFilters?.member_search || '',
        member_id: initialFilters?.member_id || '',
        name_search: initialFilters?.name_search || '',
        membership_no_search: initialFilters?.membership_no_search || '',
        cnic_search: initialFilters?.cnic_search || '',
        contact_search: initialFilters?.contact_search || '',
        status: initialFilters?.status || [],
        categories: initialFilters?.categories || [],
        quarters_pending: initialFilters?.quarters_pending || '1',
        per_page: initialFilters?.per_page || '15',
        date: initialFilters?.date || dayjs().format('DD-MM-YYYY'),
    });
    const [queryFilters, setQueryFilters] = useState({
        ...{
            member_search: initialFilters?.member_search || '',
            member_id: initialFilters?.member_id || '',
            name_search: initialFilters?.name_search || '',
            membership_no_search: initialFilters?.membership_no_search || '',
            cnic_search: initialFilters?.cnic_search || '',
            contact_search: initialFilters?.contact_search || '',
            status: initialFilters?.status || [],
            categories: initialFilters?.categories || [],
            quarters_pending: initialFilters?.quarters_pending || '1',
            per_page: initialFilters?.per_page || '15',
            date: initialFilters?.date || dayjs().format('DD-MM-YYYY'),
        },
        page: initialFilters?.page || 1,
    });

    // Suggestions State
    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [noSuggestions, setNoSuggestions] = useState([]);
    const [cnicSuggestions, setCnicSuggestions] = useState([]);
    const [contactSuggestions, setContactSuggestions] = useState([]);

    // Fetch Suggestions Helper
    const createFetchSuggestions = (setter) =>
        debounce(async (query) => {
            if (!query) {
                setter([]);
                return;
            }
            try {
                const response = await axios.get(route('api.bookings.search-customers'), {
                    params: { query, type: 'member' },
                });
                setter(response.data);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300);

    const fetchNameSuggestions = useMemo(() => createFetchSuggestions(setNameSuggestions), []);
    const fetchNoSuggestions = useMemo(() => createFetchSuggestions(setNoSuggestions), []);
    const fetchCnicSuggestions = useMemo(() => createFetchSuggestions(setCnicSuggestions), []);
    const fetchContactSuggestions = useMemo(() => createFetchSuggestions(setContactSuggestions), []);

    // Effect to trigger fetches when inputs change
    useEffect(() => {
        if (allFilters.member_search) {
            // We don't know if member_search came from Name or No input if they share the variable.
            // But for autocomplete, we trigger on the *input method* (onInputChange), not the state effect.
            // So we don't strictly need this effect if we use onInputChange.
            // However, to pre-populate suggestions if desired? No, usually fine.
        }
    }, []);

    const quartersOptions = [
        { label: '1 Quarter', value: '1' },
        { label: '2 Quarters', value: '2' },
        { label: '3 Quarters', value: '3' },
        { label: '4 Quarters', value: '4' },
        { label: '5 Quarters', value: '5' },
        { label: 'More than 5', value: '6+' },
    ];

    // Fixed status options from AddForm3.jsx
    const statusOptions = ['active', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process'];

    const formatCurrency = (amount) => new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(amount || 0);

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('en-GB');
    };

    useEffect(() => {
        const nextFilters = {
            member_search: initialFilters?.member_search || '',
            member_id: initialFilters?.member_id || '',
            name_search: initialFilters?.name_search || '',
            membership_no_search: initialFilters?.membership_no_search || '',
            cnic_search: initialFilters?.cnic_search || '',
            contact_search: initialFilters?.contact_search || '',
            status: initialFilters?.status || [],
            categories: initialFilters?.categories || [],
            quarters_pending: initialFilters?.quarters_pending || '1',
            per_page: initialFilters?.per_page || '15',
            date: initialFilters?.date || dayjs().format('DD-MM-YYYY'),
        };
        setAllFilters(nextFilters);
        setQueryFilters({ ...nextFilters, page: initialFilters?.page || 1 });
    }, [JSON.stringify(initialFilters)]);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        axios
            .get(route('membership.pending-maintenance-report.data'), { params: queryFilters })
            .then((res) => {
                if (cancelled) return;
                setMembersData(res.data?.members || null);
                setStatisticsData(res.data?.statistics || null);
            })
            .catch(() => {
                if (cancelled) return;
                setMembersData(null);
                setStatisticsData(null);
            })
            .finally(() => {
                if (cancelled) return;
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [JSON.stringify(queryFilters)]);

    const handleSearch = () => {
        if (embedded) {
            setQueryFilters({ ...allFilters, page: 1 });
            return;
        }
        router.get(route('membership.pending-maintenance-report'), allFilters, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handlePageChange = (event, page) => {
        if (embedded) {
            setQueryFilters({ ...allFilters, page });
            return;
        }
        router.get(
            route('membership.pending-maintenance-report'),
            {
                ...allFilters,
                page: page,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleFilterChange = (field, value) => {
        setAllFilters((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleReset = () => {
        const resetFilters = {
            member_search: '',
            member_id: '',
            name_search: '',
            membership_no_search: '',
            cnic_search: '',
            contact_search: '',
            status: [],
            categories: [],
            quarters_pending: '1',
            per_page: '15',
            date: dayjs().format('DD-MM-YYYY'),
        };
        setAllFilters(resetFilters);
        if (embedded) {
            setQueryFilters({ ...resetFilters, page: 1 });
            return;
        }
        router.get(route('membership.pending-maintenance-report'));
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'success';
            case 'suspended':
                return 'error';
            case 'in suspension process':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getPendingQuartersColor = (quarters) => {
        if (quarters >= 4) return '#dc2626'; // Red - Critical
        if (quarters >= 2) return '#d97706'; // Orange - Warning
        return '#059669'; // Green - Normal
    };

    const handleBack = () => {
        if (embedded && onClose) {
            onClose();
            return;
        }
        window.history.back();
    };

    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedMembers(membersData?.data?.map((m) => m.id) || []);
        } else {
            setSelectedMembers([]);
        }
    };

    const handleSelectOne = (event, id) => {
        if (event.target.checked) {
            setSelectedMembers((prev) => [...prev, id]);
        } else {
            setSelectedMembers((prev) => prev.filter((item) => item !== id));
        }
    };

    const handleBulkStatusChange = () => {
        if (selectedMembers.length === 0) return alert('Please select members first.');
        if (!newStatus) return alert('Please select a status.');

        router.post(
            route('membership.pending-maintenance-report.bulk-status'),
            {
                member_ids: selectedMembers,
                status: newStatus,
                reason: statusReason,
            },
            {
                onSuccess: () => {
                    setStatusModalOpen(false);
                    setSelectedMembers([]);
                    setNewStatus('');
                    setStatusReason('');
                },
            },
        );
    };

    const handleBulkPrint = () => {
        if (selectedMembers.length === 0) return alert('Please select members first.');

        // Construct URL for bulk print
        const url = route('membership.pending-maintenance-report.bulk-print', {
            member_ids: selectedMembers,
        });
        window.open(url, '_blank');
    };

    const handlePrintInvoice = async (member) => {
        const pendingQuarters = Number(member?.pending_quarters || 0);
        if (!pendingQuarters || pendingQuarters < 1) {
            alert('No pending quarters found for this member.');
            return;
        }

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await axios.post(
                route('membership.pending-maintenance-report.invoice'),
                {
                    member_id: member.id,
                    pending_quarters: pendingQuarters,
                    date: allFilters.date,
                },
                csrfToken
                    ? {
                          headers: {
                              'X-CSRF-TOKEN': csrfToken,
                          },
                      }
                    : undefined,
            );

            const invoiceId = res.data?.invoice_id;
            if (!invoiceId) {
                alert('Invoice not found.');
                return;
            }

            setSelectedInvoiceId(invoiceId);
            setShowInvoiceModal(true);
        } catch (e) {
            const status = e?.response?.status;
            const serverMsg = e?.response?.data?.error || e?.response?.data?.message;
            if (status === 419) {
                alert('Session expired. Please refresh the page and try again.');
                return;
            }
            alert(serverMsg || 'Unable to generate invoice.');
        }
    };

    return (
        <>
            {/* Status Change Modal */}
            {statusModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}
                >
                    <Paper sx={{ p: 4, width: '400px' }}>
                        <Typography variant="h6" mb={2}>
                            Change Status for {selectedMembers.length} Members
                        </Typography>
                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                            <InputLabel>New Status</InputLabel>
                            <Select value={newStatus} label="New Status" onChange={(e) => setNewStatus(e.target.value)} MenuProps={{ style: { zIndex: 10001 } }}>
                                {statusOptions.map((s) => (
                                    <MenuItem key={s} value={s}>
                                        {s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField fullWidth multiline rows={3} label="Reason (Optional)" value={statusReason} onChange={(e) => setStatusReason(e.target.value)} sx={{ mb: 2 }} />
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                            <Button onClick={() => setStatusModalOpen(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleBulkStatusChange}>
                                Update
                            </Button>
                        </Box>
                    </Paper>
                </div>
            )}

            {/* <SideNav open={open} setOpen={setOpen} />
            <div
                style={{
                    marginLeft: open ? `${drawerWidthOpen}px` : `${drawerWidthClosed}px`,
                    transition: 'margin-left 0.3s ease-in-out',
                    marginTop: '5rem',
                    backgroundColor: '#F6F6F6',
                }}
            > */}
            <div className="container-fluid px-4 py-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
                {/* Top Bar */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center">
                        <IconButton onClick={handleBack}>
                            <ArrowBack sx={{ color: '#063455' }} />
                        </IconButton>
                        <Typography sx={{ fontWeight: 600, fontSize: '24px', color: '#063455' }}>Pending Maintenance Report</Typography>
                    </div>
                    <Box>
                        {/* Bulk Actions */}
                        {selectedMembers.length > 0 && (
                            <>
                                <Button variant="outlined" color="warning" sx={{ mr: 2 }} onClick={() => setStatusModalOpen(true)}>
                                    Change Status ({selectedMembers.length})
                                </Button>
                                <Button variant="outlined" sx={{ mr: 2 }} onClick={handleBulkPrint}>
                                    Print Selected ({selectedMembers.length})
                                </Button>
                            </>
                        )}

                        <Button
                            variant="contained"
                            startIcon={<Print />}
                            onClick={() => {
                                const currentUrl = new URL(window.location.href);
                                const printUrl = currentUrl.pathname + '/print' + currentUrl.search;
                                window.open(printUrl, '_blank');
                            }}
                            sx={{
                                backgroundColor: '#063455',
                                color: 'white',
                                textTransform: 'none',
                                borderRadius: '16px',
                                '&:hover': {
                                    backgroundColor: '#052d47',
                                },
                            }}
                        >
                            Print
                        </Button>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                const url = route('membership.pending-maintenance-report.export', allFilters);
                                window.open(url, '_blank');
                            }}
                            sx={{
                                ml: 2,
                                color: '#063455',
                                borderColor: '#063455',
                                textTransform: 'none',
                                borderRadius: '16px',
                                '&:hover': {
                                    backgroundColor: '#f3f4f6',
                                    borderColor: '#063455',
                                },
                            }}
                        >
                            Export
                        </Button>
                    </Box>
                </div>

                {/* Search and Filters */}
                <Box sx={{ mb: 3, pt: 2 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#063455', mb: 3 }}>Search & Filter Options</Typography>

                    {/* Search Fields */}
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        {/* 1. Search Name */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={nameSuggestions}
                                getOptionLabel={(option) => option.full_name || option.name || option.value || option}
                                inputValue={allFilters.member_search}
                                onChange={(event, option) => {
                                    if (option && option.id) {
                                        handleFilterChange('member_id', option.id);
                                        handleFilterChange('member_search', option.full_name || option.name || '');
                                        handleFilterChange('name_search', '');
                                    } else {
                                        handleFilterChange('member_id', '');
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('member_search', newInputValue);
                                    fetchNameSuggestions(newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Name" placeholder="Member Name..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.full_name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* 2. Search Membership No */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={noSuggestions}
                                getOptionLabel={(option) => option.membership_no || option.customer_no || option.value || option}
                                inputValue={allFilters.membership_no_search}
                                onChange={(event, option) => {
                                    if (option && option.id) {
                                        handleFilterChange('member_id', option.id);
                                        handleFilterChange('membership_no_search', option.membership_no || option.customer_no || '');
                                        handleFilterChange('name_search', '');
                                    } else {
                                        handleFilterChange('member_id', '');
                                    }
                                }}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('membership_no_search', newInputValue);
                                    fetchNoSuggestions(newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search Member No" placeholder="Membership #..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.membership_no || option.customer_no}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.full_name || option.label}
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* 3. Search CNIC */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={cnicSuggestions}
                                getOptionLabel={(option) => option.cnic_no || option.cnic || option.value || option}
                                inputValue={allFilters.cnic_search}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('cnic_search', newInputValue);
                                    fetchCnicSuggestions(newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params} fullWidth size="small" label="Search CNIC" placeholder="CNIC..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.cnic_no || option.cnic}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.full_name} ({option.membership_no})
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>

                        {/* 4. Search Contact */}
                        <Grid item xs={12} md={3}>
                            <Autocomplete
                                freeSolo
                                disablePortal
                                options={contactSuggestions}
                                getOptionLabel={(option) => option.mobile_number_a || option.contact || option.value || option}
                                inputValue={allFilters.contact_search}
                                onInputChange={(event, newInputValue) => {
                                    handleFilterChange('contact_search', newInputValue);
                                    fetchContactSuggestions(newInputValue);
                                }}
                                renderInput={(params) => <TextField {...params}
                                    fullWidth size="small"
                                    label="Search Contact"
                                    placeholder="Mobile..."
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }} />}
                                renderOption={(props, option) => (
                                    <li {...props} key={option.id || option.label}>
                                        <Box sx={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                                <Typography variant="body2" fontWeight="bold">
                                                    {option.mobile_number_a || option.contact}
                                                </Typography>
                                                {option.status && (
                                                    <Chip
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                            ml: 1,
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography variant="caption" color="text.secondary">
                                                {option.name || option.full_name} ({option.membership_no})
                                            </Typography>
                                        </Box>
                                    </li>
                                )}
                            />
                        </Grid>
                    </Grid>

                    {/* Filter Fields */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                    <InputLabel>Member Status</InputLabel>
                                    <Select
                                        multiple
                                        value={allFilters.status}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        renderValue={(selected) => (
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {selected.map((value) => (
                                                    <Chip key={value} label={value} size="small" />
                                                ))}
                                            </Box>
                                        )}
                                    >
                                        {all_statuses &&
                                            all_statuses.map((status) => (
                                                <MenuItem key={status} value={status}>
                                                    {status}
                                                </MenuItem>
                                            ))}
                                    </Select>
                                </FormControl> */}
                            <Autocomplete
                                multiple
                                size="small"
                                fullWidth
                                options={statusOptions}
                                getOptionLabel={(option) => option.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                value={allFilters.status || []}
                                onChange={(event, newValue) => {
                                    handleFilterChange('status', newValue);
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) =>
                                        <Chip label={option.replace(/_/g, ' ').replace(/\b\w/g,
                                            (c) => c.toUpperCase())}
                                            size="small" {...getTagProps({ index })}
                                            key={option} />)}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300, // optional height
                                        px: 1,

                                        "& .MuiAutocomplete-option": {
                                            borderRadius: "16px",
                                            mx: 0.5,
                                            my: 0.5,
                                        },

                                        "& .MuiAutocomplete-option:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },
                                    },
                                }}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Member Status"
                                        placeholder="Select status"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            {/* <FormControl fullWidth size="small">
                                <InputLabel>Member Category</InputLabel>
                                <Select
                                    multiple
                                    value={allFilters.categories}
                                    onChange={(e) => handleFilterChange('categories', e.target.value)}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {selected.map((value) => {
                                                const category = all_categories?.find((cat) => cat.id === value);
                                                return <Chip key={value} label={category?.name || value} size="small" />;
                                            })}
                                        </Box>
                                    )}
                                >
                                    {all_categories &&
                                        all_categories.map((category) => (
                                            <MenuItem key={category.id} value={category.id}>
                                                {category.name}
                                            </MenuItem>
                                        ))}
                                </Select>
                            </FormControl> */}
                            <Autocomplete
                                multiple
                                size="small"
                                fullWidth
                                options={all_categories || []}
                                getOptionLabel={(option) => option.name}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                value={all_categories?.filter((cat) => allFilters.categories.includes(cat.id)) || []}
                                onChange={(event, newValue) => {
                                    handleFilterChange(
                                        'categories',
                                        newValue.map((cat) => cat.id),
                                    );
                                }}
                                renderTags={(value, getTagProps) =>
                                    value.map((option, index) =>
                                        <Chip key={option.id}
                                            label={option.name}
                                            size="small" {...getTagProps({ index })} />)}
                                ListboxProps={{
                                    sx: {
                                        maxHeight: 300, // optional height
                                        px: 1,

                                        "& .MuiAutocomplete-option": {
                                            borderRadius: "16px",
                                            mx: 0.5,
                                            my: 0.5,
                                        },

                                        "& .MuiAutocomplete-option:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },

                                        "& .MuiAutocomplete-option[aria-selected='true']:hover": {
                                            backgroundColor: "#063455",
                                            color: "#fff",
                                        },
                                    },
                                }}
                                renderInput={(params) =>
                                    <TextField {...params}
                                        label="Member Category"
                                        placeholder="Select categories"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '16px' } }}
                                    />}
                            />
                        </Grid>

                        {/* New Quarters Filter */}
                        <Grid item xs={12} md={3}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "16px",
                                    },
                                    "& fieldset": {
                                        borderRadius: "16px",
                                    },
                                }}
                            >
                                <InputLabel>Quarters Pending</InputLabel>
                                <Select value={allFilters.quarters_pending || '1'}
                                    label="Quarters Pending"
                                    onChange={(e) => handleFilterChange('quarters_pending', e.target.value)}
                                    MenuProps={{
                                        PaperProps: {
                                            sx: {
                                                maxHeight: 300,
                                                p: 1,

                                                "& .MuiMenuItem-root": {
                                                    borderRadius: "16px",
                                                    mx: 0.5,
                                                    my: 0.5
                                                },

                                                "& .MuiMenuItem-root:hover": {
                                                    backgroundColor: "#063455",
                                                    color: "#fff",
                                                },

                                                "& .MuiMenuItem-root.Mui-selected": {
                                                    backgroundColor: "#063455",
                                                    color: "#fff",
                                                },

                                                "& .MuiMenuItem-root.Mui-selected:hover": {
                                                    backgroundColor: "#063455",
                                                    color: "#fff",
                                                },
                                            },
                                        },
                                    }}
                                >
                                    {quartersOptions.map((opt) => (
                                        <MenuItem key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <FormControl
                                fullWidth
                                size="small"
                                sx={{
                                    "& .MuiOutlinedInput-root": {
                                        borderRadius: "16px",
                                    },
                                    "& fieldset": {
                                        borderRadius: "16px",
                                    },
                                }}
                            >
                                <InputLabel>Rows</InputLabel>
                                <Select
                                    value={allFilters.per_page || '15'}
                                    label="Rows"
                                    onChange={(e) => handleFilterChange('per_page', e.target.value)}
                                >
                                    <MenuItem value="15">15</MenuItem>
                                    <MenuItem value="30">30</MenuItem>
                                    <MenuItem value="50">50</MenuItem>
                                    <MenuItem value="100">100</MenuItem>
                                    <MenuItem value="all">All</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    label="As-of Date"
                                    format="DD-MM-YYYY"
                                    value={allFilters.date ? dayjs(allFilters.date, "DD-MM-YYYY") : dayjs()}
                                    onChange={(newValue) =>
                                        handleFilterChange(
                                            "date",
                                            newValue ? newValue.format("DD-MM-YYYY") : dayjs().format("DD-MM-YYYY")
                                        )
                                    }
                                    slotProps={{
                                        textField: {
                                            fullWidth: true,
                                            size: "small",
                                            sx: {
                                                "& .MuiOutlinedInput-root": {
                                                    borderRadius: "16px",
                                                },
                                                "& fieldset": {
                                                    borderRadius: "16px",
                                                },
                                            },
                                        },
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        {/* Buttons: Reset and Search */}
                        <Grid item xs={12} md={3} sx={{ display: 'flex', gap: 2 }}>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleReset}
                                sx={{
                                    borderRadius: '16px',
                                    height: '40px',
                                    minWidth: '120px',
                                    textTransform: 'none',
                                    color: '#063455',
                                    border: '1px solid #063455'
                                }}
                            >
                                Reset
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<Search />}
                                onClick={handleSearch}
                                sx={{
                                    backgroundColor: '#063455',
                                    borderRadius: '16px',
                                    height: '40px',
                                    minWidth: '120px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: '#063455',
                                    },
                                }}
                            >
                                Search
                            </Button>
                        </Grid>
                    </Grid>
                </Box>

                {/* Pending Maintenance Table */}
                <Box sx={{ mb: 3 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '20px', color: '#063455', mb: 2 }}>Pending Maintenance Details</Typography>
                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    )}
                    <TableContainer sx={{ borderRadius: '16px' }}>
                        <Table>
                            <TableHead>
                                <TableRow style={{ backgroundColor: '#063455' }}>
                                    <TableCell padding="checkbox">
                                        <input type="checkbox" onChange={handleSelectAll} checked={membersData?.data?.length > 0 && selectedMembers.length === membersData?.data?.length} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                                    </TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>SR</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>ID</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Member</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Name</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Contact</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Address</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Per Quarter</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Discount</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Debit</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Credit</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Balance</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>Pending</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Status</TableCell>
                                    <TableCell sx={{ color: 'white', fontSize: '14px', fontWeight: 600, }}>Print</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {membersData?.data &&
                                    membersData.data.length > 0 &&
                                    membersData.data.map((member, index) => (
                                        <TableRow
                                            key={member.id}
                                            sx={{
                                                '&:nth-of-type(odd)': { backgroundColor: '#f9fafb' },
                                                '&:hover': { backgroundColor: '#f3f4f6' },
                                                borderBottom: '1px solid #e5e7eb',
                                            }}
                                        >
                                            <TableCell padding="checkbox">
                                                <input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={(e) => handleSelectOne(e, member.id)} style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                                            </TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{index + 1}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{member.id}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{member.membership_no}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{member.full_name}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px' }}>{member.contact || '-'}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 500, fontSize: '14px', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.address || '-'}</TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(member.quarterly_fee)}</TableCell>
                                            <TableCell sx={{ color: '#374151', fontWeight: 600, fontSize: '14px' }}>{formatCurrency(member.discount)}</TableCell>
                                            <TableCell sx={{ color: '#dc2626', fontWeight: 700, fontSize: '14px' }}>{formatCurrency(member.debit)}</TableCell>
                                            <TableCell sx={{ color: '#059669', fontWeight: 700, fontSize: '14px' }}>{formatCurrency(member.credit)}</TableCell>
                                            <TableCell sx={{ color: '#111827', fontWeight: 800, fontSize: '14px' }}>{formatCurrency(member.balance)}</TableCell>
                                            <TableCell sx={{ color: '#111827', fontWeight: 800, fontSize: '14px' }}>{formatCurrency(member.total_pending_amount)}</TableCell>
                                            <TableCell>
                                                <Chip label={member.status} color={getStatusColor(member.status)} size="small" sx={{ textTransform: 'capitalize' }} />
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    onClick={() => handlePrintInvoice(member)}
                                                    sx={{
                                                        color: '#dc2626',
                                                        borderColor: '#dc2626',
                                                        fontSize: '12px',
                                                        textTransform: 'none',
                                                        '&:hover': {
                                                            backgroundColor: '#fef2f2',
                                                            borderColor: '#dc2626',
                                                        },
                                                    }}
                                                >
                                                    Print
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                {/* Footer Row */}
                                {membersData?.data && membersData.data.length > 0 && (
                                    <TableRow sx={{ backgroundColor: '#063455', borderTop: '2px solid #374151' }}>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }} colSpan={7}>
                                            TOTAL ({statisticsData?.total_members || 0} Members)
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{formatCurrency(statisticsData?.total_discount || 0)}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{formatCurrency(statisticsData?.total_debit || 0)}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{formatCurrency(statisticsData?.total_credit || 0)}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }}>{formatCurrency(statisticsData?.total_balance || 0)}</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: 'white', fontSize: '16px' }}>{formatCurrency(statisticsData?.total_pending_amount || 0)}</TableCell>
                                        <TableCell colSpan={2} sx={{ fontWeight: 700, color: 'white', fontSize: '14px' }} />
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {/* Pagination */}
                    {allFilters.per_page !== 'all' && membersData?.data && membersData.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                            <Pagination
                                count={membersData.last_page}
                                page={membersData.current_page}
                                onChange={handlePageChange}
                                color="primary"
                                size="large"
                                showFirstButton
                                showLastButton
                                sx={{
                                    '& .MuiPaginationItem-root': {
                                        fontSize: '16px',
                                    },
                                }}
                            />
                        </Box>
                    )}

                    {/* Pagination Info */}
                    {membersData?.data && membersData.data.length > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                            <Typography variant="body2" color="textSecondary">
                                Showing {membersData.from} to {membersData.to} of {membersData.total} results
                            </Typography>
                        </Box>
                    )}
                </Box>
            </div>
            {/* </div> */}
            <PendingMaintenanceInvoiceSlip
                open={showInvoiceModal}
                onClose={() => {
                    setShowInvoiceModal(false);
                    setSelectedInvoiceId(null);
                }}
                invoiceId={selectedInvoiceId}
            />
        </>
    );
};

const PendingMaintenanceReport = () => {
    const { members, statistics, filters, all_statuses, all_categories } = usePage().props;

    return (
        <PendingMaintenanceReportView
            initialMembers={members}
            initialStatistics={statistics}
            initialFilters={filters}
            all_statuses={all_statuses}
            all_categories={all_categories}
        />
    );
};

export default PendingMaintenanceReport;
