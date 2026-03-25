import React, { useState, useEffect } from 'react';
import { Typography, Button, createTheme, ThemeProvider, TextField, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Paper, IconButton, Avatar, Box, InputAdornment, Menu, MenuItem, Tooltip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Chip, Autocomplete, CircularProgress } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import axios from 'axios';
import { Search, Delete, Visibility, Add } from '@mui/icons-material';
import 'bootstrap/dist/css/bootstrap.min.css';
import { router, usePage } from '@inertiajs/react';
import { useSnackbar } from 'notistack';
import { FaEdit } from 'react-icons/fa';
import dayjs from 'dayjs';
import debounce from 'lodash.debounce';
import MembershipCardComponent from '../Membership/UserCard';
import MembershipSuspensionDialog from '../Membership/Modal';
import MembershipPauseDialog from '../Membership/MembershipPauseDialog';
import MembershipCancellationDialog from '../Membership/CancelModal';
import ActivateMembershipDialog from '../Membership/ActivateMembershipDialog';
import PopupState, { bindTrigger, bindMenu } from 'material-ui-popup-state';
import { MdModeEdit } from 'react-icons/md';
import CorporateMembershipDashboardFilter from './CorporateMembershipDashboardFilter';
import InvoiceSlip from '../Membership/Invoice';
import { Description as ReceiptIcon } from '@mui/icons-material';
import AppPage from '@/components/App/ui/AppPage';
import AdminDataTable from '@/components/App/ui/AdminDataTable';
import SurfaceCard from '@/components/App/ui/SurfaceCard';
import FilterToolbar from '@/components/App/ui/FilterToolbar';
import { AdminIconAction, AdminPillAction, AdminRowActionGroup } from '@/components/App/ui/AdminRowActions';
import Pagination from '@/components/Pagination';
const CorporateMembers = ({ members, memberCategories = [], cities = [] }) => {
    const props = usePage().props;
    const { enqueueSnackbar } = useSnackbar();
    const buildInitialFilters = React.useCallback(
        () => ({
            membership_no: props.filters?.membership_no || '',
            barcode: props.filters?.barcode || '',
            name: props.filters?.name || '',
            cnic: props.filters?.cnic || '',
            contact: props.filters?.contact || '',
            city: props.filters?.city || '',
            duration: props.filters?.duration || 'all',
            card_status: props.filters?.card_status || 'all',
            status: props.filters?.status || 'all',
            member_category: props.filters?.member_category || 'all',
            selected_member_id: props.filters?.selected_member_id || '',
            sort: props.filters?.sort || 'desc',
            sortBy: props.filters?.sortBy || 'id',
            per_page: props.filters?.per_page || members?.per_page || 25,
            page: 1,
        }),
        [members?.per_page, props.filters],
    );

    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);
    const [deletedMemberIds, setDeletedMemberIds] = useState([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);
    const [openCardModal, setOpenCardModal] = useState(false);
    const [cardMember, setCardMember] = useState(null);
    const [openInvoiceModal, setOpenInvoiceModal] = useState(false);
    const [invoiceMember, setInvoiceMember] = useState(null);
    const [memberNameOptions, setMemberNameOptions] = useState([]);
    const [membershipNoOptions, setMembershipNoOptions] = useState([]);
    const [loadingMemberNames, setLoadingMemberNames] = useState(false);
    const [loadingMembershipNos, setLoadingMembershipNos] = useState(false);
    const [filters, setFilters] = useState(buildInitialFilters);
    const filtersRef = React.useRef(filters);

    // Status Dialog States
    const [suspendOpen, setSuspendOpen] = useState(false);
    const [pauseOpen, setPauseOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [activateOpen, setActivateOpen] = useState(false);

    const handleStatusSuccess = (newStatus) => {
        enqueueSnackbar(`Status updated to ${newStatus}`, { variant: 'success' });
    };

    const handleDeleteClick = (member) => {
        setMemberToDelete(member);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (memberToDelete) {
            axios
                .delete(route('corporate-membership.destroy', memberToDelete.id))
                .then(() => {
                    setDeletedMemberIds((prev) => [...prev, memberToDelete.id]);
                    setDeleteDialogOpen(false);
                    setMemberToDelete(null);
                    enqueueSnackbar('Corporate member deleted successfully', { variant: 'success' });
                })
                .catch((error) => {
                    console.error('Error deleting member:', error);
                    enqueueSnackbar('Failed to delete member. Please try again.', { variant: 'error' });
                    setDeleteDialogOpen(false);
                });
        }
    };

    const cleanFilters = React.useCallback((nextFilters) => {
        const cleanedEntries = Object.entries(nextFilters).filter(([key, value]) => {
            if (key === 'per_page') {
                return true;
            }

            if (value === '' || value === null || value === undefined) {
                return false;
            }

            if (['status', 'card_status', 'member_category', 'duration'].includes(key) && value === 'all') {
                return false;
            }

            if (key === 'page' && Number(value) === 1) {
                return false;
            }

            return true;
        });

        return Object.fromEntries(cleanedEntries);
    }, []);

    const submitFilters = React.useCallback(
        (nextFilters) => {
            const cleanedFilters = cleanFilters(nextFilters);
            router.get(route('corporate-membership.members'), cleanedFilters, {
                preserveScroll: true,
                preserveState: false,
                replace: true,
            });
        },
        [cleanFilters],
    );

    const debouncedSubmit = React.useMemo(() => debounce((nextFilters) => submitFilters(nextFilters), 350), [submitFilters]);

    useEffect(() => () => debouncedSubmit.cancel(), [debouncedSubmit]);

    useEffect(() => {
        const nextFilters = buildInitialFilters();
        filtersRef.current = nextFilters;
        setFilters(nextFilters);
    }, [buildInitialFilters]);

    const updateFilters = React.useCallback(
        (partialFilters, { immediate = false } = {}) => {
            const nextFilters = {
                ...filtersRef.current,
                ...partialFilters,
            };

            if (!Object.prototype.hasOwnProperty.call(partialFilters, 'page')) {
                nextFilters.page = 1;
            }

            filtersRef.current = nextFilters;
            setFilters(nextFilters);

            if (immediate) {
                debouncedSubmit.cancel();
                submitFilters(nextFilters);
                return;
            }

            debouncedSubmit(nextFilters);
        },
        [debouncedSubmit, submitFilters],
    );

    const updateFilter = React.useCallback(
        (name, value, options = {}) => {
            updateFilters({ [name]: value }, options);
        },
        [updateFilters],
    );

    const resetFilters = React.useCallback(() => {
        debouncedSubmit.cancel();
        const nextFilters = {
            ...buildInitialFilters(),
            membership_no: '',
            barcode: '',
            name: '',
            cnic: '',
            contact: '',
            city: '',
            duration: 'all',
            card_status: 'all',
            status: 'all',
            member_category: 'all',
            selected_member_id: '',
            page: 1,
        };

        filtersRef.current = nextFilters;
        setFilters(nextFilters);
        submitFilters(nextFilters);
    }, [buildInitialFilters, debouncedSubmit, submitFilters]);

    useEffect(() => {
        if (!filters.name || filters.name.trim().length < 2) {
            setMemberNameOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingMemberNames(true);
            try {
                const response = await axios.get(route('api.corporate-members.search'), {
                    params: { query: filters.name },
                });
                setMemberNameOptions(response.data.members || []);
            } catch (error) {
                setMemberNameOptions([]);
            } finally {
                setLoadingMemberNames(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.name]);

    useEffect(() => {
        if (!filters.membership_no || filters.membership_no.trim().length < 2) {
            setMembershipNoOptions([]);
            return;
        }

        const timer = setTimeout(async () => {
            setLoadingMembershipNos(true);
            try {
                const response = await axios.get(route('api.corporate-members.search'), {
                    params: { query: filters.membership_no },
                });
                setMembershipNoOptions(response.data.members || []);
            } catch (error) {
                setMembershipNoOptions([]);
            } finally {
                setLoadingMembershipNos(false);
            }
        }, 350);

        return () => clearTimeout(timer);
    }, [filters.membership_no]);

    const handleAutocompleteSelect = (filterName, selectedValue, valueKey) => {
        if (typeof selectedValue === 'string') {
            updateFilters(
                {
                    [filterName]: selectedValue,
                    selected_member_id: '',
                },
                { immediate: true },
            );
            return;
        }

        updateFilters(
            {
                [filterName]: selectedValue?.[valueKey] || '',
                selected_member_id: selectedValue?.id || '',
            },
            { immediate: true },
        );
    };

    const handleApplyFilters = () => {
        debouncedSubmit.cancel();
        submitFilters(filtersRef.current);
    };

    const visibleMembers = members.data.filter((member) => !deletedMemberIds.includes(member.id));
    const corporateColumns = [
        { key: 'membership_no', label: 'Membership No', minWidth: 150 },
        { key: 'member', label: 'Member', minWidth: 260 },
        { key: 'category', label: 'Category', minWidth: 180 },
        { key: 'type', label: 'Type', minWidth: 120 },
        { key: 'cnic', label: 'CNIC', minWidth: 170 },
        { key: 'contact', label: 'Contact', minWidth: 150 },
        { key: 'membership_date', label: 'Membership Date', minWidth: 150 },
        { key: 'card_status', label: 'Card Status', minWidth: 130 },
        { key: 'status', label: 'Status', minWidth: 170 },
        { key: 'card', label: 'Card', minWidth: 100, align: 'center' },
        { key: 'action', label: 'Action', minWidth: 160, align: 'center' },
    ];

    return (
        <>
            <div className="container-fluid p-4 pt-4" style={{ backgroundColor: '#f5f5f5', minHeight: '100vh', overflowX: 'hidden' }}>
                <AppPage
                    eyebrow="Membership"
                    title="All Corporate Members"
                    subtitle="Manage corporate memberships with live filters, cleaner tables, and shared pagination."
                    actions={[
                        <Button
                            key="deleted"
                            variant="outlined"
                            startIcon={<Delete />}
                            onClick={() => router.get(route('corporate-membership.trashed'))}
                            sx={{
                                color: '#d32f2f',
                                borderColor: '#d32f2f',
                                borderRadius: '16px',
                                textTransform: 'none',
                                '&:hover': { backgroundColor: '#ffebee', borderColor: '#d32f2f' },
                            }}
                        >
                            Deleted Members
                        </Button>,
                        <Button
                            key="add"
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => router.get(route('corporate-membership.add'))}
                            sx={{
                                backgroundColor: '#063455',
                                borderRadius: '16px',
                                textTransform: 'none',
                                '&:hover': { backgroundColor: '#052a42' },
                            }}
                        >
                            Add Corporate Member
                        </Button>,
                    ]}
                >
                    <SurfaceCard title="Live Filters" subtitle="Results update automatically while you search or change any corporate member filter.">
                        <FilterToolbar
                            onReset={resetFilters}
                            actions={
                                <Button variant="contained" onClick={handleApplyFilters} sx={{ borderRadius: '14px', textTransform: 'none', backgroundColor: '#063455', '&:hover': { backgroundColor: '#052a42' } }}>
                                    Search
                                </Button>
                            }
                        >
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
                                <Autocomplete
                                    freeSolo
                                    options={membershipNoOptions}
                                    filterOptions={(options) => options}
                                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.membership_no || '')}
                                    inputValue={filters.membership_no}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            updateFilters({
                                                membership_no: newInputValue,
                                                selected_member_id: '',
                                            });
                                        }
                                    }}
                                    onChange={(event, newValue) => handleAutocompleteSelect('membership_no', newValue, 'membership_no')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Membership #"
                                            fullWidth
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingMembershipNos ? <CircularProgress color="inherit" size={18} /> : null}
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
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {option.membership_no}
                                                    </Typography>
                                                    <Chip
                                                        component="span"
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.full_name}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                                <Autocomplete
                                    freeSolo
                                    options={memberNameOptions}
                                    filterOptions={(options) => options}
                                    getOptionLabel={(option) => (typeof option === 'string' ? option : option.full_name || '')}
                                    inputValue={filters.name}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            updateFilters({
                                                name: newInputValue,
                                                selected_member_id: '',
                                            });
                                        }
                                    }}
                                    onChange={(event, newValue) => handleAutocompleteSelect('name', newValue, 'full_name')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Name"
                                            fullWidth
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {loadingMemberNames ? <CircularProgress color="inherit" size={18} /> : null}
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
                                                    <Typography variant="body2" fontWeight={700}>
                                                        {option.full_name}
                                                    </Typography>
                                                    <Chip
                                                        component="span"
                                                        label={option.status}
                                                        size="small"
                                                        sx={{
                                                            height: '20px',
                                                            fontSize: '10px',
                                                            backgroundColor: option.status === 'active' ? '#e8f5e9' : option.status === 'suspended' ? '#fff3e0' : '#ffebee',
                                                            color: option.status === 'active' ? '#2e7d32' : option.status === 'suspended' ? '#ef6c00' : '#c62828',
                                                            textTransform: 'capitalize',
                                                        }}
                                                    />
                                                </Box>
                                                <Typography variant="caption" color="text.secondary">
                                                    {option.membership_no} | {option.mobile_number_a || 'N/A'}
                                                </Typography>
                                            </Box>
                                        </li>
                                    )}
                                />
                                <TextField label="Barcode" value={filters.barcode} onChange={(e) => updateFilter('barcode', e.target.value)} fullWidth />
                                <TextField label="CNIC" value={filters.cnic} onChange={(e) => updateFilter('cnic', e.target.value)} fullWidth />
                                <TextField label="Contact" value={filters.contact} onChange={(e) => updateFilter('contact', e.target.value)} fullWidth />
                                <Autocomplete
                                    freeSolo
                                    options={cities}
                                    filterOptions={(options) => options}
                                    inputValue={filters.city}
                                    onInputChange={(event, newInputValue, reason) => {
                                        if (reason === 'input' || reason === 'clear') {
                                            updateFilter('city', newInputValue);
                                        }
                                    }}
                                    onChange={(event, newValue) => handleAutocompleteSelect('city', newValue, 'label')}
                                    renderInput={(params) => <TextField {...params} label="City" fullWidth />}
                                />
                                <TextField select label="Status" value={filters.status} onChange={(e) => updateFilter('status', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All statuses</MenuItem>
                                    <MenuItem value="active">Active</MenuItem>
                                    <MenuItem value="suspended">Suspended</MenuItem>
                                    <MenuItem value="cancelled">Cancelled</MenuItem>
                                    <MenuItem value="absent">Absent</MenuItem>
                                </TextField>
                                <TextField select label="Member Category" value={filters.member_category} onChange={(e) => updateFilter('member_category', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All categories</MenuItem>
                                    {memberCategories.map((category) => (
                                        <MenuItem key={category.id} value={category.id}>
                                            {category.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                                <TextField select label="Card Status" value={filters.card_status} onChange={(e) => updateFilter('card_status', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All card statuses</MenuItem>
                                    <MenuItem value="Active">Active</MenuItem>
                                    <MenuItem value="Expired">Expired</MenuItem>
                                    <MenuItem value="Suspend">Suspend</MenuItem>
                                </TextField>
                                <TextField select label="Duration" value={filters.duration} onChange={(e) => updateFilter('duration', e.target.value, { immediate: true })} fullWidth>
                                    <MenuItem value="all">All durations</MenuItem>
                                    <MenuItem value="lt1y">Less than 1 year</MenuItem>
                                    <MenuItem value="1to3y">1 to 3 years</MenuItem>
                                    <MenuItem value="3to5y">3 to 5 years</MenuItem>
                                    <MenuItem value="gt5y">More than 5 years</MenuItem>
                                </TextField>
                            </Box>
                        </FilterToolbar>
                    </SurfaceCard>

                    <SurfaceCard title="Corporate Member Register" subtitle="Standardized corporate membership table with current status controls and adjustable page size.">
                        <AdminDataTable
                            columns={corporateColumns}
                            rows={visibleMembers}
                            pagination={members}
                            emptyMessage="No corporate members found."
                            tableMinWidth={1460}
                            renderRow={(user) => (
                                <TableRow key={user.id} hover sx={{ '& .MuiTableCell-body': { borderBottomColor: '#edf2f7' } }}>
                                    <TableCell
                                        onClick={() => router.visit(route('corporate-membership.profile', user.id))}
                                        sx={{
                                            color: '#000',
                                            fontWeight: 600,
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            '&:hover': { color: '#7f7f7f', fontWeight: 600 },
                                        }}
                                    >
                                        {user.membership_no || 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="d-flex align-items-center">
                                            <Avatar src={user.profile_photo?.file_path || '/placeholder.svg?height=40&width=40'} alt={user.full_name} style={{ marginRight: '10px' }} />
                                            <div>
                                                <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '120px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={user.full_name} arrow>
                                                        <span>{user.full_name}</span>
                                                    </Tooltip>
                                                </Typography>
                                                <Typography sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '120px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    <Tooltip title={user.personal_email} arrow>
                                                        <span>{user.personal_email}</span>
                                                    </Tooltip>
                                                </Typography>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{user.member_category?.description || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>
                                        <Chip label="Corporate" size="small" sx={{ backgroundColor: '#1976d2', color: 'white', fontWeight: 600, fontSize: '11px' }} />
                                    </TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', whiteSpace: 'nowrap' }}>{user.cnic_no || 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px', maxWidth: '100px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                        <Tooltip title={user.mobile_number_a || 'N/A'} arrow>
                                            <span>{user.mobile_number_a || 'N/A'}</span>
                                        </Tooltip>
                                    </TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.membership_date ? dayjs(user.membership_date).format('DD-MM-YYYY') : 'N/A'}</TableCell>
                                    <TableCell sx={{ color: '#7F7F7F', fontWeight: 400, fontSize: '14px' }}>{user.card_status || 'N/A'}</TableCell>
                                    <TableCell>
                                        <PopupState variant="popover" popupId={`status-menu-${user.id}`}>
                                            {(popupState) => (
                                                <>
                                                    <div
                                                        {...bindTrigger(popupState)}
                                                        style={{
                                                            cursor: 'pointer',
                                                            display: 'inline-block',
                                                        }}
                                                    >
                                                        <Chip
                                                            label={user.status || 'N/A'}
                                                            size="small"
                                                            sx={{
                                                                backgroundColor: 'transparent',
                                                                color: user.status === 'active' ? '#2E7D32' : user.status === 'suspended' ? '#e65100' : user.status === 'absent' ? '#fbc02d' : '#D32F2F',
                                                                fontWeight: 'medium',
                                                                textTransform: 'capitalize',
                                                                whiteSpace: 'nowrap',
                                                            }}
                                                        />
                                                        <MdModeEdit size={18} style={{ marginLeft: '5px', color: '#2E7D32' }} />
                                                    </div>
                                                    <Menu {...bindMenu(popupState)}>
                                                        <MenuItem
                                                            onClick={() => {
                                                                popupState.close();
                                                                setSelectedMember(user);
                                                                setSuspendOpen(true);
                                                            }}
                                                        >
                                                            Suspend
                                                        </MenuItem>
                                                        <MenuItem
                                                            onClick={() => {
                                                                popupState.close();
                                                                setSelectedMember(user);
                                                                setPauseOpen(true);
                                                            }}
                                                        >
                                                            Absent
                                                        </MenuItem>
                                                        <MenuItem
                                                            onClick={() => {
                                                                popupState.close();
                                                                setSelectedMember(user);
                                                                setCancelOpen(true);
                                                            }}
                                                        >
                                                            Cancel Membership
                                                        </MenuItem>
                                                        <MenuItem
                                                            onClick={() => {
                                                                popupState.close();
                                                                setSelectedMember(user);
                                                                setActivateOpen(true);
                                                            }}
                                                        >
                                                            Activate
                                                        </MenuItem>
                                                    </Menu>
                                                </>
                                            )}
                                        </PopupState>
                                    </TableCell>
                                    <TableCell align="center">
                                        <AdminPillAction
                                            label="Card"
                                            onClick={() => {
                                                setCardMember({ ...user, is_corporate: true });
                                                setOpenCardModal(true);
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <AdminRowActionGroup justify="center">
                                            <AdminIconAction title="View Profile" onClick={() => router.visit(route('corporate-membership.profile', user.id))}>
                                                <Visibility size={18} />
                                            </AdminIconAction>
                                            <AdminIconAction title="Edit Member" onClick={() => router.visit(route('corporate-membership.edit', user.id))} color="warning">
                                                <FaEdit size={16} />
                                            </AdminIconAction>
                                            <AdminIconAction
                                                title="View Invoice"
                                                onClick={() => {
                                                    setInvoiceMember(user);
                                                    setOpenInvoiceModal(true);
                                                }}
                                                color="success"
                                            >
                                                <ReceiptIcon fontSize="small" />
                                            </AdminIconAction>
                                            <AdminIconAction title="Delete Member" onClick={() => handleDeleteClick(user)} color="error">
                                                <Delete size={18} />
                                            </AdminIconAction>
                                        </AdminRowActionGroup>
                                    </TableCell>
                                </TableRow>
                            )}
                        />
                    </SurfaceCard>
                </AppPage>
                {/* Delete Confirmation Dialog */}
                <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                    <DialogTitle>Confirm Deletion</DialogTitle>
                    <DialogContent>
                        <DialogContentText style={{ color: '#D32F2F' }}>Are you sure you want to delete this corporate member? </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setDeleteDialogOpen(false)} style={{ color: '#063455', border: '1px solid #063455' }}>
                            Cancel
                        </Button>
                        <Button onClick={confirmDelete} autoFocus style={{ color: '#D32F2F', border: '1px solid #D32F2F' }}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>

            <MembershipCardComponent open={openCardModal} onClose={() => setOpenCardModal(false)} member={cardMember} memberData={members} />

            {/* Status Dialogs */}
            <MembershipSuspensionDialog open={suspendOpen} onClose={() => setSuspendOpen(false)} memberId={selectedMember?.id} onSuccess={handleStatusSuccess} updateUrl={route('corporate-membership.update-status')} />
            <MembershipPauseDialog open={pauseOpen} onClose={() => setPauseOpen(false)} memberId={selectedMember?.id} onSuccess={handleStatusSuccess} updateUrl={route('corporate-membership.update-status')} />
            <MembershipCancellationDialog open={cancelOpen} onClose={() => setCancelOpen(false)} memberId={selectedMember?.id} onSuccess={handleStatusSuccess} updateUrl={route('corporate-membership.update-status')} />
            <ActivateMembershipDialog open={activateOpen} onClose={() => setActivateOpen(false)} memberId={selectedMember?.id} onSuccess={handleStatusSuccess} updateUrl={route('corporate-membership.update-status')} />

            <InvoiceSlip
                open={openInvoiceModal}
                onClose={() => {
                    setOpenInvoiceModal(false);
                    setInvoiceMember(null);
                }}
                invoiceNo={invoiceMember?.membership_invoice?.id ? null : invoiceMember?.id}
                invoiceId={invoiceMember?.membership_invoice?.id || null}
            />
        </>
    );
};

export default CorporateMembers;
